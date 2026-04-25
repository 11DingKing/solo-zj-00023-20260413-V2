from flask_restx import Namespace, Resource, fields
from models import Recipe, User, Rating, Favorite
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request
from sqlalchemy import or_, desc, func
from datetime import datetime

recipe_ns = Namespace("recipe", description="A namespace for Recipes")

ingredient_model = recipe_ns.model(
    "Ingredient",
    {
        "name": fields.String(required=True),
        "quantity": fields.String(required=True),
    },
)

step_model = recipe_ns.model(
    "Step",
    {
        "order": fields.Integer(required=True),
        "instruction": fields.String(required=True),
    },
)

recipe_model = recipe_ns.model(
    "Recipe",
    {
        "id": fields.Integer(),
        "title": fields.String(),
        "description": fields.String(),
        "ingredients": fields.List(fields.Nested(ingredient_model)),
        "steps": fields.List(fields.Nested(step_model)),
        "user_id": fields.Integer(),
        "creator_username": fields.String(),
        "created_at": fields.DateTime(),
        "average_rating": fields.Float(),
        "rating_count": fields.Integer(),
        "is_favorited": fields.Boolean(),
    },
)

recipe_create_model = recipe_ns.model(
    "RecipeCreate",
    {
        "title": fields.String(required=True),
        "description": fields.String(required=True),
        "ingredients": fields.List(fields.Nested(ingredient_model), required=True),
        "steps": fields.List(fields.Nested(step_model), required=True),
    },
)

paginated_recipe_model = recipe_ns.model(
    "PaginatedRecipes",
    {
        "items": fields.List(fields.Nested(recipe_model)),
        "total": fields.Integer(),
        "page": fields.Integer(),
        "pages": fields.Integer(),
        "per_page": fields.Integer(),
    },
)


def serialize_recipe(recipe, current_user_id=None):
    rating_info = recipe.get_average_rating()
    is_favorited = recipe.is_favorited_by(current_user_id) if current_user_id else False
    
    return {
        "id": recipe.id,
        "title": recipe.title,
        "description": recipe.description,
        "ingredients": recipe.ingredients or [],
        "steps": recipe.steps or [],
        "user_id": recipe.user_id,
        "creator_username": recipe.creator.username if recipe.creator else None,
        "created_at": recipe.created_at.isoformat() if recipe.created_at else None,
        "average_rating": rating_info["average"],
        "rating_count": rating_info["count"],
        "is_favorited": is_favorited,
    }


def get_current_user_id():
    try:
        from flask_jwt_extended import verify_jwt_in_request
        verify_jwt_in_request()
        current_user = get_jwt_identity()
        if current_user:
            user = User.query.filter_by(username=current_user).first()
            return user.id if user else None
    except:
        pass
    return None


@recipe_ns.route("/hello")
class HelloResource(Resource):
    def get(self):
        return {"message": "Hello World"}


@recipe_ns.route("/recipes")
class RecipesResource(Resource):
    @recipe_ns.marshal_with(paginated_recipe_model)
    def get(self):
        """Get all recipes with search, sort, and pagination"""
        search = request.args.get("search", "")
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 8, type=int)
        sort_by = request.args.get("sort_by", "created_at")
        
        current_user_id = get_current_user_id()

        query = Recipe.query
        
        if search:
            query = query.filter(
                or_(
                    Recipe.title.ilike(f"%{search}%"),
                    Recipe.description.ilike(f"%{search}%"),
                )
            )
        
        if sort_by == "rating":
            from sqlalchemy.orm import aliased
            RatingAlias = aliased(Rating)
            query = query.outerjoin(RatingAlias).group_by(Recipe.id).order_by(
                desc(func.coalesce(func.avg(RatingAlias.rating), 0))
            )
        else:
            query = query.order_by(desc(Recipe.created_at))

        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        items = [serialize_recipe(recipe, current_user_id) for recipe in pagination.items]

        return {
            "items": items,
            "total": pagination.total,
            "page": pagination.page,
            "pages": pagination.pages,
            "per_page": per_page,
        }

    @recipe_ns.marshal_with(recipe_model)
    @recipe_ns.expect(recipe_create_model)
    @jwt_required()
    def post(self):
        """Create a new recipe"""
        current_user = get_jwt_identity()
        user = User.query.filter_by(username=current_user).first()
        
        if not user:
            return {"message": "User not found"}, 404

        data = request.get_json()

        new_recipe = Recipe(
            title=data.get("title"),
            description=data.get("description"),
            ingredients=data.get("ingredients", []),
            steps=data.get("steps", []),
            user_id=user.id,
        )

        new_recipe.save()

        return serialize_recipe(new_recipe, user.id), 201


@recipe_ns.route("/recipe/<int:id>")
class RecipeResource(Resource):
    @recipe_ns.marshal_with(recipe_model)
    def get(self, id):
        """Get a recipe by id"""
        recipe = Recipe.query.get_or_404(id)
        current_user_id = get_current_user_id()
        return serialize_recipe(recipe, current_user_id)

    @recipe_ns.marshal_with(recipe_model)
    @jwt_required()
    def put(self, id):
        """Update a recipe by id"""
        recipe_to_update = Recipe.query.get_or_404(id)
        
        current_user = get_jwt_identity()
        user = User.query.filter_by(username=current_user).first()
        
        if not user or recipe_to_update.user_id != user.id:
            return {"message": "Not authorized to update this recipe"}, 403

        data = request.get_json()

        recipe_to_update.update(
            data.get("title"),
            data.get("description"),
            data.get("ingredients"),
            data.get("steps"),
        )

        return serialize_recipe(recipe_to_update, user.id)

    @recipe_ns.marshal_with(recipe_model)
    @jwt_required()
    def delete(self, id):
        """Delete a recipe by id"""
        recipe_to_delete = Recipe.query.get_or_404(id)
        
        current_user = get_jwt_identity()
        user = User.query.filter_by(username=current_user).first()
        
        if not user or recipe_to_delete.user_id != user.id:
            return {"message": "Not authorized to delete this recipe"}, 403

        recipe_to_delete.delete()

        return serialize_recipe(recipe_to_delete, user.id)


@recipe_ns.route("/recipe/<int:recipe_id>/favorite")
class FavoriteToggleResource(Resource):
    @jwt_required()
    def post(self, recipe_id):
        """Toggle favorite for a recipe"""
        current_user = get_jwt_identity()
        user = User.query.filter_by(username=current_user).first()
        
        if not user:
            return {"message": "User not found"}, 404
        
        recipe = Recipe.query.get_or_404(recipe_id)
        
        existing_favorite = Favorite.query.filter_by(
            user_id=user.id,
            recipe_id=recipe_id
        ).first()
        
        is_favorited = False
        
        if existing_favorite:
            existing_favorite.delete()
            is_favorited = False
        else:
            new_favorite = Favorite(
                user_id=user.id,
                recipe_id=recipe_id
            )
            new_favorite.save()
            is_favorited = True
        
        return {
            "recipe_id": recipe_id,
            "is_favorited": is_favorited,
            "message": "Favorite toggled successfully"
        }


@recipe_ns.route("/favorites")
class FavoritesListResource(Resource):
    @recipe_ns.marshal_with(paginated_recipe_model)
    @jwt_required()
    def get(self):
        """Get user's favorite recipes with pagination"""
        current_user = get_jwt_identity()
        user = User.query.filter_by(username=current_user).first()
        
        if not user:
            return {"message": "User not found"}, 404
        
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 8, type=int)
        sort_by = request.args.get("sort_by", "created_at")
        
        query = Recipe.query.join(Favorite).filter(Favorite.user_id == user.id)
        
        if sort_by == "rating":
            from sqlalchemy.orm import aliased
            RatingAlias = aliased(Rating)
            query = query.outerjoin(RatingAlias).group_by(Recipe.id).order_by(
                desc(func.coalesce(func.avg(RatingAlias.rating), 0))
            )
        else:
            query = query.order_by(desc(Favorite.created_at))
        
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        items = [serialize_recipe(recipe, user.id) for recipe in pagination.items]

        return {
            "items": items,
            "total": pagination.total,
            "page": pagination.page,
            "pages": pagination.pages,
            "per_page": per_page,
        }
