from exts import db
from sqlalchemy import func
from datetime import datetime


class Recipe(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    title = db.Column(db.String(), nullable=False)
    description = db.Column(db.Text(), nullable=False)
    ingredients = db.Column(db.JSON(), nullable=False, default=list)
    steps = db.Column(db.JSON(), nullable=False, default=list)
    user_id = db.Column(db.Integer(), db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime(), nullable=False, default=datetime.utcnow)
    
    ratings = db.relationship('Rating', backref='recipe', lazy=True, cascade='all, delete-orphan')
    favorites = db.relationship('Favorite', backref='recipe', lazy=True, cascade='all, delete-orphan')
    creator = db.relationship('User', backref='recipes', lazy=True)

    def __repr__(self):
        return f"<Recipe {self.title} >"

    def save(self):
        db.session.add(self)
        db.session.commit()

    def delete(self):
        db.session.delete(self)
        db.session.commit()

    def update(self, title, description, ingredients=None, steps=None):
        self.title = title
        self.description = description
        if ingredients is not None:
            self.ingredients = ingredients
        if steps is not None:
            self.steps = steps
        db.session.commit()

    def get_average_rating(self):
        result = db.session.query(
            func.avg(Rating.rating).label('average'),
            func.count(Rating.id).label('count')
        ).filter(Rating.recipe_id == self.id).first()
        
        return {
            'average': float(result.average) if result.average else 0,
            'count': result.count or 0
        }
    
    def is_favorited_by(self, user_id):
        if not user_id:
            return False
        return Favorite.query.filter_by(recipe_id=self.id, user_id=user_id).first() is not None


class Favorite(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    user_id = db.Column(db.Integer(), db.ForeignKey('user.id'), nullable=False)
    recipe_id = db.Column(db.Integer(), db.ForeignKey('recipe.id'), nullable=False)
    created_at = db.Column(db.DateTime(), nullable=False, default=datetime.utcnow)
    
    __table_args__ = (
        db.UniqueConstraint('user_id', 'recipe_id', name='unique_favorite_per_user_per_recipe'),
    )

    def __repr__(self):
        return f"<Favorite User {self.user_id} -> Recipe {self.recipe_id}>"

    def save(self):
        db.session.add(self)
        db.session.commit()

    def delete(self):
        db.session.delete(self)
        db.session.commit()


class Rating(db.Model):
    id = db.Column(db.Integer(), primary_key=True)
    rating = db.Column(db.Integer(), nullable=False)
    recipe_id = db.Column(db.Integer(), db.ForeignKey('recipe.id'), nullable=False)
    user_id = db.Column(db.Integer(), db.ForeignKey('user.id'), nullable=False)

    __table_args__ = (
        db.UniqueConstraint('recipe_id', 'user_id', name='unique_rating_per_user_per_recipe'),
    )

    def __repr__(self):
        return f"<Rating {self.rating} for Recipe {self.recipe_id} by User {self.user_id}>"

    def save(self):
        db.session.add(self)
        db.session.commit()

    def update(self, rating):
        self.rating = rating
        db.session.commit()


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(25), nullable=False, unique=True)
    email = db.Column(db.String(80), nullable=False)
    password = db.Column(db.Text(), nullable=False)

    def __repr__(self):
        return f"<User {self.username}>"

    def save(self):
        db.session.add(self)
        db.session.commit()
