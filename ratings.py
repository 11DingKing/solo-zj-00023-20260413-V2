from flask_restx import Namespace, Resource, fields
from models import Recipe, Rating, User
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request, jsonify


rating_ns = Namespace("rating", description="A namespace for Ratings")


rating_model = rating_ns.model(
    "Rating",
    {
        "id": fields.Integer(),
        "rating": fields.Integer(),
        "recipe_id": fields.Integer(),
        "user_id": fields.Integer(),
    },
)

rating_input_model = rating_ns.model(
    "RatingInput",
    {
        "rating": fields.Integer(required=True, min=1, max=5),
    },
)

recipe_rating_model = rating_ns.model(
    "RecipeRating",
    {
        "recipe_id": fields.Integer(),
        "average_rating": fields.Float(),
        "rating_count": fields.Integer(),
        "user_rating": fields.Integer(),
    },
)


@rating_ns.route("/recipe/<int:recipe_id>")
class RecipeRatingResource(Resource):
    @rating_ns.marshal_with(recipe_rating_model)
    def get(self, recipe_id):
        """Get rating info for a recipe"""
        recipe = Recipe.query.get_or_404(recipe_id)
        rating_info = recipe.get_average_rating()
        
        current_user = None
        try:
            from flask_jwt_extended import verify_jwt_in_request
            verify_jwt_in_request()
            current_user = get_jwt_identity()
        except:
            pass
        
        user_rating = None
        if current_user:
            user = User.query.filter_by(username=current_user).first()
            if user:
                rating = Rating.query.filter_by(recipe_id=recipe_id, user_id=user.id).first()
                if rating:
                    user_rating = rating.rating
        
        return {
            "recipe_id": recipe_id,
            "average_rating": rating_info["average"],
            "rating_count": rating_info["count"],
            "user_rating": user_rating,
        }

    @rating_ns.expect(rating_input_model)
    @rating_ns.marshal_with(recipe_rating_model)
    @jwt_required()
    def post(self, recipe_id):
        """Rate a recipe (create or update)"""
        current_user = get_jwt_identity()
        user = User.query.filter_by(username=current_user).first()
        
        if not user:
            return {"message": "User not found"}, 404
        
        recipe = Recipe.query.get_or_404(recipe_id)
        
        data = request.get_json()
        rating_value = data.get("rating")
        
        if rating_value < 1 or rating_value > 5:
            return {"message": "Rating must be between 1 and 5"}, 400
        
        existing_rating = Rating.query.filter_by(recipe_id=recipe_id, user_id=user.id).first()
        
        if existing_rating:
            existing_rating.update(rating_value)
        else:
            new_rating = Rating(
                rating=rating_value,
                recipe_id=recipe_id,
                user_id=user.id,
            )
            new_rating.save()
        
        rating_info = recipe.get_average_rating()
        
        return {
            "recipe_id": recipe_id,
            "average_rating": rating_info["average"],
            "rating_count": rating_info["count"],
            "user_rating": rating_value,
        }
