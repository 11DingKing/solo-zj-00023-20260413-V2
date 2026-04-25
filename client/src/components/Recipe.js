import React, { useEffect, useState } from "react";
import { Button, Card, Modal } from "react-bootstrap";
import StarRating from "./StarRating";
import { useAuth } from "../auth";

const Recipe = ({ recipe, onClick, onDelete, onRatingUpdate }) => {
  const [logged] = useAuth();
  const [ratingData, setRatingData] = useState({
    averageRating: 0,
    ratingCount: 0,
    userRating: null,
  });

  useEffect(() => {
    fetchRatingData();
  }, [recipe.id]);

  const fetchRatingData = () => {
    const token = localStorage.getItem("REACT_TOKEN_AUTH_KEY");
    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${JSON.parse(token)}`;
    }

    fetch(`/rating/recipe/${recipe.id}`, {
      method: "GET",
      headers: headers,
    })
      .then((res) => res.json())
      .then((data) => {
        setRatingData({
          averageRating: data.average_rating,
          ratingCount: data.rating_count,
          userRating: data.user_rating,
        });
      })
      .catch((err) => console.log(err));
  };

  const handleRatingUpdate = (data) => {
    setRatingData({
      averageRating: data.average_rating,
      ratingCount: data.rating_count,
      userRating: data.user_rating,
    });
    if (onRatingUpdate) {
      onRatingUpdate(recipe.id, data);
    }
  };

  return (
    <Card className="recipe">
      <Card.Body>
        <Card.Title>{recipe.title}</Card.Title>
        <p>{recipe.description}</p>
        <div className="recipe-rating">
          <StarRating
            recipeId={recipe.id}
            averageRating={ratingData.averageRating}
            ratingCount={ratingData.ratingCount}
            userRating={ratingData.userRating}
            isLoggedIn={logged}
            onRatingUpdate={handleRatingUpdate}
          />
        </div>
        <Button variant="primary" onClick={onClick}>
          Update
        </Button>{" "}
        <Button variant="danger" onClick={onDelete}>
          Delete
        </Button>
      </Card.Body>
    </Card>
  );
};

export default Recipe;
