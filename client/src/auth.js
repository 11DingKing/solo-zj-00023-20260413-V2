import { createAuthProvider } from 'react-token-auth'

export const [useAuth, authFetch, login, logout] =
    createAuthProvider({
        accessTokenKey: 'REACT_TOKEN_AUTH_KEY',
        onUpdateToken: (token) => fetch('/auth/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        .then(r => r.json())
    })
