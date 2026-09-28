from recommender import recommender


SAMPLE_PRODUCT_IDS = ["wrk-001", "kit-001", "liv-001", "bed-001", "fit-001"]


def main() -> None:
    names = recommender.products.set_index("productId")["name"].to_dict()
    for product_id in SAMPLE_PRODUCT_IDS:
        print(f"\n{names[product_id]} ({product_id})")
        print("-" * 64)
        for rank, item in enumerate(recommender.get_similar(product_id, 5), start=1):
            print(
                f"{rank}. {names[item['productId']]:38} "
                f"score={item['score']:.4f}"
            )


if __name__ == "__main__":
    main()
