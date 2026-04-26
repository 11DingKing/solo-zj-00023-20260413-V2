import React, { useState } from 'react'
import { Form, Button, Alert } from 'react-bootstrap'
import { Link, useHistory } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { login } from '../auth'


const LoginPage = () => {
    const history = useHistory()
    const { register, handleSubmit, reset, formState: { errors } } = useForm()
    const [showError, setShowError] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const loginUser = async (data) => {
        console.log('Login data:', data)
        setShowError(false)
        setIsLoading(true)

        const requestOptions = {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: data.username,
                password: data.password
            })
        }

        try {
            const res = await fetch('/auth/login', requestOptions)
            const result = await res.json()
            console.log('Login response:', result)

            if (result.access_token) {
                console.log('Login successful, token:', result.access_token)
                login(result.access_token)
                reset()
                history.push('/')
            } else {
                setErrorMessage(result.message || '用户名或密码错误')
                setShowError(true)
            }
        } catch (err) {
            console.error('Login error:', err)
            setErrorMessage('网络错误，请稍后重试')
            setShowError(true)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="container">
            <div className="form">
                <h1 className="mb-4">登录账户</h1>

                {showError && (
                    <Alert variant="danger" onClose={() => setShowError(false)} dismissible>
                        {errorMessage}
                    </Alert>
                )}

                <Form onSubmit={handleSubmit(loginUser)}>
                    <Form.Group className="mb-3">
                        <Form.Label>用户名</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="请输入用户名"
                            disabled={isLoading}
                            {...register('username', { required: true, maxLength: 25 })}
                        />
                        {errors.username && (
                            <p className="text-danger small mt-1 mb-0">
                                <small>用户名是必填项（最多25个字符）</small>
                            </p>
                        )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>密码</Form.Label>
                        <Form.Control
                            type="password"
                            placeholder="请输入密码"
                            disabled={isLoading}
                            {...register('password', { required: true, minLength: 8 })}
                        />
                        {errors.password && (
                            <p className="text-danger small mt-1 mb-0">
                                <small>密码是必填项（至少8个字符）</small>
                            </p>
                        )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Button 
                            variant="primary" 
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? '登录中...' : '登录'}
                        </Button>
                    </Form.Group>

                    <Form.Group>
                        <small>没有账户？<Link to='/signup'>立即注册</Link></small>
                    </Form.Group>
                </Form>
            </div>
        </div>
    )
}

export default LoginPage
