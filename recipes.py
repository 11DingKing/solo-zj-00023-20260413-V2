from flask_restx import Namespace, Resource, fields
from models import Recipe
from flask_jwt_extended import jwt_required
from flask import request
from sqlalchemy import or_


recipe_ns = Namespace("recipe", description="A namespace for Recipes")


recipe_model = recipe_ns.model(
    "Recipe",
    {"id": fields.Integer(), "title": fields.String(), "description": fields.String()},
)

paginated_recipe_model = recipe_ns.model(
    "PaginatedRecipes",
    {
        "items": fields.List(fields.Nested(recipe_model)),
        "total": fields.Integer(),
        "page": fields.Integer(),
        "pages": fields.Integer(),
    },
)


@recipe_ns.route("/hello")
class HelloResource(Resource):
    def get(self):
        return {"message": "Hello World"}


@recipe_ns.route("/recipes")
class RecipesResource(Resource):
    @recipe_ns.marshal_with(paginated_recipe_model)
    def get(self):
        """Get all recipes with search and pagination"""
        search = request.args.get("search", "")
        page = request.args.get("page", 1, type=int)
        per_page = 8

        query = Recipe.query
        if search:
            query = query.filter(
                or_(
                    Recipe.title.ilike(f"%{search}%"),
                    Recipe.description.ilike(f"%{search}%"),
                )
            )

        pagination = query.paginate(page=page, per_page=per_page, error_out=False)

        return {
            "items": pagination.items,
            "total": pagination.total,
            "page": pagination.page,
            "pages": pagination.pages,
        }

    @recipe_ns.marshal_with(recipe_model)
    @recipe_ns.expect(recipe_model)
    @jwt_required()
    def post(self):
        """Create a new recipe"""

        data = request.get_json()

        new_recipe = Recipe(
            title=data.get("title"), description=data.get("description")
        )

        new_recipe.save()

        return new_recipe, 201


@recipe_ns.route("/recipe/<int:id>")
class RecipeResource(Resource):
    @recipe_ns.marshal_with(recipe_model)
    def get(self, id):
        """Get a recipe by id"""
        recipe = Recipe.query.get_or_404(id)

        return recipe

    @recipe_ns.marshal_with(recipe_model)
    @jwt_required()
    def put(self, id):
        """Update a recipe by id"""

        recipe_to_update = Recipe.query.get_or_404(id)

        data = request.get_json()

        recipe_to_update.update(data.get("title"), data.get("description"))

        return recipe_to_update

    @recipe_ns.marshal_with(recipe_model)
    @jwt_required()
    def delete(self, id):
        """Delete a recipe by id"""

        recipe_to_delete = Recipe.query.get_or_404(id)

        recipe_to_delete.delete()

        return recipe_to_delete
