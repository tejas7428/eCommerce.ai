from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


DATA_PATH = Path(__file__).resolve().parent / "data" / "products.json"


class ProductRecommender:
    def __init__(self, data_path: Path = DATA_PATH) -> None:
        self.products = pd.read_json(data_path)
        self.products["productId"] = self.products["productId"].astype(str)
        self._validate_catalog()
        self.id_to_index = {
            product_id: index
            for index, product_id in enumerate(self.products["productId"])
        }

        self.products["combinedText"] = self.products.apply(
            self._build_combined_text, axis=1
        )
        self.vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            min_df=1,
            sublinear_tf=True,
        )
        self.tfidf_matrix = self.vectorizer.fit_transform(
            self.products["combinedText"]
        )
        self.similarity_matrix = cosine_similarity(self.tfidf_matrix)

    def _validate_catalog(self) -> None:
        required = {
            "productId",
            "name",
            "brand",
            "category",
            "collection",
            "price",
            "description",
            "tags",
            "imageUrl",
        }
        missing = required.difference(self.products.columns)
        if missing:
            raise ValueError(f"Catalog is missing fields: {', '.join(sorted(missing))}")
        if self.products["productId"].duplicated().any():
            raise ValueError("Catalog productId values must be unique")

    @staticmethod
    def _build_combined_text(product: pd.Series) -> str:
        tags = " ".join(product["tags"])
        use_cases = " ".join(product.get("useCases", []))
        return " ".join(
            [
                str(product["brand"]),
                str(product["category"]),
                str(product["category"]),
                str(product["collection"]),
                tags,
                tags,
                use_cases,
                use_cases,
                str(product["description"]),
            ]
        )

    def all_product_ids(self) -> set[str]:
        return set(self.id_to_index)

    def unknown_ids(self, product_ids: list[str]) -> list[str]:
        return sorted(set(product_ids).difference(self.id_to_index))

    def _result(
        self,
        product_index: int,
        score: float,
        because_index: int | None = None,
    ) -> dict[str, Any]:
        product = self.products.iloc[product_index]
        result: dict[str, Any] = {
            "productId": product["productId"],
            "score": round(float(score), 4),
        }
        if because_index is not None:
            because = self.products.iloc[because_index]
            result.update(
                {
                    "becauseProductId": because["productId"],
                    "becauseProductName": because["name"],
                }
            )
        return result

    def get_similar(self, product_id: str, n: int = 5) -> list[dict[str, Any]]:
        if product_id not in self.id_to_index:
            raise KeyError(product_id)

        source_index = self.id_to_index[product_id]
        ranked_indices = np.argsort(self.similarity_matrix[source_index])[::-1]
        recommendations = [
            index for index in ranked_indices if index != source_index
        ][:n]
        return [
            self._result(index, self.similarity_matrix[source_index, index], source_index)
            for index in recommendations
        ]

    def _cold_start(self, n: int) -> list[dict[str, Any]]:
        categories = list(dict.fromkeys(self.products["category"].tolist()))
        category_rows = {
            category: self.products.index[
                self.products["category"] == category
            ].tolist()
            for category in categories
        }
        selected: list[int] = []
        depth = 0
        while len(selected) < n:
            added = False
            for category in categories:
                rows = category_rows[category]
                if depth < len(rows):
                    selected.append(rows[depth])
                    added = True
                    if len(selected) == n:
                        break
            if not added:
                break
            depth += 1

        return [self._result(index, 0.0) for index in selected]

    def recommend_for_user(
        self, viewed_ids: list[str], n: int = 8
    ) -> list[dict[str, Any]]:
        if not viewed_ids:
            return self._cold_start(n)

        unknown = self.unknown_ids(viewed_ids)
        if unknown:
            raise KeyError(", ".join(unknown))

        # The API sends history from oldest to newest, so later views receive
        # progressively larger weights while still retaining earlier interests.
        viewed_indices = [self.id_to_index[product_id] for product_id in viewed_ids]
        weights = np.linspace(1.0, 2.0, num=len(viewed_indices))
        weighted_vectors = self.tfidf_matrix[viewed_indices].multiply(weights[:, None])
        user_profile = np.asarray(weighted_vectors.sum(axis=0) / weights.sum())
        profile_scores = cosine_similarity(user_profile, self.tfidf_matrix).ravel()

        viewed_set = set(viewed_indices)
        ranked_indices = [
            index
            for index in np.argsort(profile_scores)[::-1]
            if index not in viewed_set
        ][:n]

        results = []
        for index in ranked_indices:
            similarities = self.similarity_matrix[index, viewed_indices]
            because_index = viewed_indices[int(np.argmax(similarities))]
            results.append(self._result(index, profile_scores[index], because_index))
        return results

    def recommend_for_idea(self, idea: str, n: int = 12) -> list[dict[str, Any]]:
        idea_vector = self.vectorizer.transform([idea])
        scores = cosine_similarity(idea_vector, self.tfidf_matrix).ravel()
        ranked_indices = np.argsort(scores)[::-1][:n]
        return [
            {
                **self._result(index, scores[index]),
                "matchReason": f'Matches your idea: “{idea}”',
            }
            for index in ranked_indices
            if scores[index] > 0
        ]


recommender = ProductRecommender()
