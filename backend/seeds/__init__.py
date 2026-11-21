from seeds.users import users
from seeds.restaurants import restaurants
from seeds.products import products
from seeds.address import addresses

def seed_database(db, User, Restaurant, Product, Address):

    for user_data in users:
        existing_user = User.query.get(
            user_data["id"]
        )

        if existing_user:
            continue

        user = User(**user_data)
        db.session.add(user)

    db.session.commit()

    for restaurant_data in restaurants:
        existing_restaurant = Restaurant.query.get(
            restaurant_data["id"]
        )

        if existing_restaurant:
            continue

        restaurant = Restaurant(**restaurant_data)
        db.session.add(restaurant)

    db.session.commit()

    for product_data in products:
        existing_product = Product.query.get(
            product_data["id"]
        )

        if existing_product:
            continue

        product = Product(**product_data)
        db.session.add(product)

    for address_data in addresses:
        existing_address = Address.query.get(
            address_data["id"]
        )

        if existing_address:
            continue

        address = Address(**address_data)
        db.session.add(address)

    db.session.commit()