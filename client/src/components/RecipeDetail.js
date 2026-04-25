import React, { useEffect, useState, useCallback } from "react";
import { useParams, useHistory } from "react-router-dom";
import { useAuth } from "../auth";
import StarRating from "./StarRating";

const RecipeDetail = () => {
  const { id } = useParams();
  const history = useHistory();
  const [logged] = useAuth();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkedIngredients, setCheckedIngredients] = useState({});

  const fetchRecipe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("REACT_TOKEN_AUTH_KEY");
      const headers = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${JSON.parse(token)}`;
      }

      const response = await fetch(`/recipe/recipe/${id}`, {
        method: "GET",
        headers: headers,
      });

      if (response.ok) {
        const data = await response.json();
        setRecipe(data);
        const initialChecked = {};
        (data.ingredients || []).forEach((_, index) => {
          initialChecked[index] = false;
        });
        setCheckedIngredients(initialChecked);
      } else {
        setError("Failed to load recipe");
      }
    } catch (err) {
      setError("An error occurred while loading the recipe");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRecipe();
  }, [fetchRecipe]);

  const toggleFavorite = async () => {
    if (!logged || !recipe) return;

    const token = localStorage.getItem("REACT_TOKEN_AUTH_KEY");
    try {
      const response = await fetch(`/recipe/recipe/${recipe.id}/favorite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${JSON.parse(token)}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecipe((prev) => ({
          ...prev,
          is_favorited: data.is_favorited,
        }));
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  const handleRatingUpdate = (data) => {
    if (recipe) {
      setRecipe((prev) => ({
        ...prev,
        average_rating: data.average_rating,
        rating_count: data.rating_count,
      }));
    }
  };

  const toggleIngredient = (index) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="container">
        <div className="error-message">{error || "Recipe not found"}</div>
        <button className="back-btn" onClick={() => history.push("/")}>
          ← 返回食谱列表
        </button>
      </div>
    );
  }

  return (
    <div className="recipe-detail-container">
      <button className="back-btn" onClick={() => history.push("/")}>
        ← 返回食谱列表
      </button>

      <div className="recipe-detail-header">
        <div className="recipe-detail-title-section">
          <h1 className="recipe-detail-title">{recipe.title}</h1>
          <div className="recipe-detail-meta">
            <span>
              创建者: <span className="creator">{recipe.creator_username || "未知"}</span>
            </span>
            <span>创建时间: {formatDate(recipe.created_at)}</span>
          </div>
        </div>
        {logged && (
          <button
            className={`recipe-detail-favorite-btn ${
              recipe.is_favorited ? "favorited" : ""
            }`}
            onClick={toggleFavorite}
            title={recipe.is_favorited ? "取消收藏" : "添加收藏"}
          >
            <span className="heart">♥</span>
          </button>
        )}
      </div>

      <div className="recipe-detail-section">
        <h2 className="recipe-detail-section-title">简介</h2>
        <p className="recipe-detail-description">{recipe.description}</p>
      </div>

      <div className="recipe-detail-section">
        <h2 className="recipe-detail-section-title">食材</h2>
        {recipe.ingredients && recipe.ingredients.length > 0 ? (
          <ul className="ingredients-list">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index} className="ingredient-item">
                <input
                  type="checkbox"
                  className="ingredient-checkbox"
                  checked={checkedIngredients[index] || false}
                  onChange={() => toggleIngredient(index)}
                />
                <span className="ingredient-name">{ingredient.name}</span>
                <span className="ingredient-quantity">{ingredient.quantity}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">暂无食材信息</p>
        )}
      </div>

      <div className="recipe-detail-section">
        <h2 className="recipe-detail-section-title">步骤</h2>
        {recipe.steps && recipe.steps.length > 0 ? (
          <ol className="steps-list">
            {recipe.steps
              .sort((a, b) => a.order - b.order)
              .map((step, index) => (
                <li key={index} className="step-item">
                  <div className="step-number">{step.order}</div>
                  <div className="step-content">
                    <p className="step-instruction">{step.instruction}</p>
                  </div>
                </li>
              ))}
          </ol>
        ) : (
          <p className="text-muted">暂无步骤信息</p>
        )}
      </div>

      <div className="recipe-detail-section">
        <h2 className="recipe-detail-section-title">评分</h2>
        <div className="rating-section">
          <div className="rating-header">
            <div className="rating-average">
              {recipe.average_rating ? recipe.average_rating.toFixed(1) : "0.0"}
            </div>
            <div>
              <StarRating
                recipeId={recipe.id}
                averageRating={recipe.average_rating || 0}
                ratingCount={recipe.rating_count || 0}
                userRating={null}
                isLoggedIn={logged}
                onRatingUpdate={handleRatingUpdate}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;
