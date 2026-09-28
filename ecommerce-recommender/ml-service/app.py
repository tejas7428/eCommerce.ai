from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from recommender import recommender


app = FastAPI(
    title="E-Commerce Recommendation Service",
    version="1.0.0",
    description="Stateless content-based recommendations using TF-IDF and cosine similarity.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class RecommendationRequest(BaseModel):
    viewedProductIds: list[str] = Field(default_factory=list, max_length=100)
    limit: int = Field(default=8, ge=1, le=20)


class RecommendationItem(BaseModel):
    productId: str
    score: float
    becauseProductId: str | None = None
    becauseProductName: str | None = None
    matchReason: str | None = None


class IdeaRequest(BaseModel):
    idea: str = Field(min_length=3, max_length=300)
    limit: int = Field(default=12, ge=1, le=24)


class RecommendationResponse(BaseModel):
    recommendations: list[RecommendationItem]
    coldStart: bool = False


@app.get("/health")
def health() -> dict[str, object]:
    return {
        "status": "ok",
        "productsLoaded": len(recommender.products),
        "model": "tfidf-cosine-similarity",
    }


@app.get("/similar/{product_id}", response_model=RecommendationResponse)
def similar_products(
    product_id: str, limit: int = Query(default=5, ge=1, le=20)
) -> RecommendationResponse:
    if product_id not in recommender.all_product_ids():
        raise HTTPException(
            status_code=404, detail=f"Unknown product ID: {product_id}"
        )
    return RecommendationResponse(
        recommendations=recommender.get_similar(product_id, limit)
    )


@app.post("/recommend", response_model=RecommendationResponse)
def recommendations(request: RecommendationRequest) -> RecommendationResponse:
    unknown = recommender.unknown_ids(request.viewedProductIds)
    if unknown:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown product IDs: {', '.join(unknown)}",
        )

    return RecommendationResponse(
        recommendations=recommender.recommend_for_user(
            request.viewedProductIds, request.limit
        ),
        coldStart=not request.viewedProductIds,
    )


@app.post("/recommend/idea", response_model=RecommendationResponse)
def idea_recommendations(request: IdeaRequest) -> RecommendationResponse:
    return RecommendationResponse(
        recommendations=recommender.recommend_for_idea(request.idea, request.limit)
    )
