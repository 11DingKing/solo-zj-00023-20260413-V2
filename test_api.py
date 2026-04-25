import unittest
from main import create_app
from config import TestConfig
from exts import db


class APITestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)

        self.client = self.app.test_client(self)

        with self.app.app_context():
            db.create_all()

    def test_hello_world(self):
        hello_response = self.client.get("/recipe/hello")

        json = hello_response.json

        # print(json)
        self.assertEqual(json, {"message": "Hello World"})

    def test_signup(self):
        signup_response = self.client.post(
            "/auth/signup",
            json={
                "username": "testuser",
                "email": "testuser@test.com",
                "password": "password",
            },
        )

        status_code = signup_response.status_code

        self.assertEqual(status_code, 201)

    def test_login(self):
        signup_response = self.client.post(
            "/auth/signup",
            json={
                "username": "testuser",
                "email": "testuser@test.com",
                "password": "password",
            },
        )

        login_response = self.client.post(
            "auth/login", json={"username": "testuser", "password": "password"}
        )

        status_code = login_response.status_code

        json = login_response.json

        # print(json)

        self.assertEqual(status_code, 200)

    def test_get_all_recipes(self):
        """TEST GETTING ALL RECIPES"""
        response = self.client.get("/recipe/recipes")

        # print(response.json)

        status_code = response.status_code

        self.assertEqual(status_code, 200)

    def test_get_one_recipe(self):
        id = 1
        response = self.client.get(f"/recipe/recipe/{id}")

        status_code = response.status_code
        # print(status_code)

        self.assertEqual(status_code, 404)

    def test_create_recipe(self):
        signup_response = self.client.post(
            "/auth/signup",
            json={
                "username": "testuser",
                "email": "testuser@test.com",
                "password": "password",
            },
        )

        login_response = self.client.post(
            "auth/login", json={"username": "testuser", "password": "password"}
        )

        access_token = login_response.json["access_token"]

        create_recipe_response = self.client.post(
            "/recipe/recipes",
            json={"title": "Test Cookie", "description": "Test description"},
            headers={"Authorization": f"Bearer {access_token}"},
        )

        status_code = create_recipe_response.status_code

        # print(create_recipe_response.json)

        self.assertEqual(status_code, 201)

    def test_update_recipe(self):
        signup_response = self.client.post(
            "/auth/signup",
            json={
                "username": "testuser",
                "email": "testuser@test.com",
                "password": "password",
            },
        )

        login_response = self.client.post(
            "auth/login", json={"username": "testuser", "password": "password"}
        )

        access_token = login_response.json["access_token"]

        create_recipe_response = self.client.post(
            "/recipe/recipes",
            json={"title": "Test Cookie", "description": "Test description"},
            headers={"Authorization": f"Bearer {access_token}"},
        )

        status_code = create_recipe_response.status_code

        id = 1

        update_response = self.client.put(
            f"recipe/recipe/{id}",
            json={
                "title": "Test Cookie Updated",
                "description": "Test description updated",
            },
            headers={"Authorization": f"Bearer {access_token}"},
        )

        status_code = update_response.status_code
        self.assertEqual(status_code, 200)

    def test_delete_recipe(self):
        signup_response = self.client.post(
            "/auth/signup",
            json={
                "username": "testuser",
                "email": "testuser@test.com",
                "password": "password",
            },
        )

        login_response = self.client.post(
            "auth/login", json={"username": "testuser", "password": "password"}
        )

        access_token = login_response.json["access_token"]

        create_recipe_response = self.client.post(
            "/recipe/recipes",
            json={"title": "Test Cookie", "description": "Test description"},
            headers={"Authorization": f"Bearer {access_token}"},
        )

        id = 1
        delete_response = self.client.delete(
            f"/recipe/recipe/{id}", headers={"Authorization": f"Bearer {access_token}"}
        )

        status_code = delete_response.status_code

        print(delete_response.json)

        self.assertEqual(status_code, 200)

    def test_rate_recipe(self):
        signup_response = self.client.post(
            "/auth/signup",
            json={
                "username": "testuser",
                "email": "testuser@test.com",
                "password": "password",
            },
        )

        login_response = self.client.post(
            "auth/login", json={"username": "testuser", "password": "password"}
        )

        access_token = login_response.json["access_token"]

        create_recipe_response = self.client.post(
            "/recipe/recipes",
            json={"title": "Test Cookie", "description": "Test description"},
            headers={"Authorization": f"Bearer {access_token}"},
        )

        recipe_id = 1

        rate_response = self.client.post(
            f"/rating/recipe/{recipe_id}",
            json={"rating": 5},
            headers={"Authorization": f"Bearer {access_token}"},
        )

        status_code = rate_response.status_code
        self.assertEqual(status_code, 200)
        self.assertEqual(rate_response.json["average_rating"], 5.0)
        self.assertEqual(rate_response.json["rating_count"], 1)
        self.assertEqual(rate_response.json["user_rating"], 5)

    def test_update_rating(self):
        signup_response = self.client.post(
            "/auth/signup",
            json={
                "username": "testuser",
                "email": "testuser@test.com",
                "password": "password",
            },
        )

        login_response = self.client.post(
            "auth/login", json={"username": "testuser", "password": "password"}
        )

        access_token = login_response.json["access_token"]

        create_recipe_response = self.client.post(
            "/recipe/recipes",
            json={"title": "Test Cookie", "description": "Test description"},
            headers={"Authorization": f"Bearer {access_token}"},
        )

        recipe_id = 1

        self.client.post(
            f"/rating/recipe/{recipe_id}",
            json={"rating": 5},
            headers={"Authorization": f"Bearer {access_token}"},
        )

        update_rate_response = self.client.post(
            f"/rating/recipe/{recipe_id}",
            json={"rating": 3},
            headers={"Authorization": f"Bearer {access_token}"},
        )

        self.assertEqual(update_rate_response.json["average_rating"], 3.0)
        self.assertEqual(update_rate_response.json["rating_count"], 1)
        self.assertEqual(update_rate_response.json["user_rating"], 3)

    def test_get_rating_info(self):
        signup_response = self.client.post(
            "/auth/signup",
            json={
                "username": "testuser",
                "email": "testuser@test.com",
                "password": "password",
            },
        )

        login_response = self.client.post(
            "auth/login", json={"username": "testuser", "password": "password"}
        )

        access_token = login_response.json["access_token"]

        create_recipe_response = self.client.post(
            "/recipe/recipes",
            json={"title": "Test Cookie", "description": "Test description"},
            headers={"Authorization": f"Bearer {access_token}"},
        )

        recipe_id = 1

        self.client.post(
            f"/rating/recipe/{recipe_id}",
            json={"rating": 4},
            headers={"Authorization": f"Bearer {access_token}"},
        )

        get_rating_response = self.client.get(
            f"/rating/recipe/{recipe_id}",
            headers={"Authorization": f"Bearer {access_token}"},
        )

        self.assertEqual(get_rating_response.json["average_rating"], 4.0)
        self.assertEqual(get_rating_response.json["rating_count"], 1)
        self.assertEqual(get_rating_response.json["user_rating"], 4)

    def test_average_rating_calculation(self):
        self.client.post(
            "/auth/signup",
            json={
                "username": "user1",
                "email": "user1@test.com",
                "password": "password",
            },
        )

        self.client.post(
            "/auth/signup",
            json={
                "username": "user2",
                "email": "user2@test.com",
                "password": "password",
            },
        )

        login1_response = self.client.post(
            "auth/login", json={"username": "user1", "password": "password"}
        )
        access_token1 = login1_response.json["access_token"]

        login2_response = self.client.post(
            "auth/login", json={"username": "user2", "password": "password"}
        )
        access_token2 = login2_response.json["access_token"]

        self.client.post(
            "/recipe/recipes",
            json={"title": "Test Cookie", "description": "Test description"},
            headers={"Authorization": f"Bearer {access_token1}"},
        )

        recipe_id = 1

        self.client.post(
            f"/rating/recipe/{recipe_id}",
            json={"rating": 4},
            headers={"Authorization": f"Bearer {access_token1}"},
        )

        self.client.post(
            f"/rating/recipe/{recipe_id}",
            json={"rating": 5},
            headers={"Authorization": f"Bearer {access_token2}"},
        )

        get_rating_response = self.client.get(
            f"/rating/recipe/{recipe_id}",
            headers={"Authorization": f"Bearer {access_token1}"},
        )

        self.assertEqual(get_rating_response.json["average_rating"], 4.5)
        self.assertEqual(get_rating_response.json["rating_count"], 2)

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()


if __name__ == "__main__":
    unittest.main()
