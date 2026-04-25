import React, { useState } from 'react'
import { Form, Button, Alert } from 'react-bootstrap'
import { Link, useHistory } from 'react-router-dom'
import { useForm } from 'react-hook-form'


const SignUpPage = () => {
    const history = useHistory()

    const { register, handleSubmit, reset, formState: { errors }, watch } = useForm();
    const [showSuccess, setShowSuccess] = useState(false)
    const [showError, setShowError] = useState(false)
    const [serverResponse, setServerResponse] = useState('')
    const password = watch('password', '')

    const submitForm = async (data) => {
        setShowError(false)
        setShowSuccess(false)

        if (data.password !== data.confirmPassword) {
            setServerResponse("两次输入的密码不一致")
            setShowError(true)
            return
        }

        const body = {
            username: data.username,
            email: data.email,
            password: data.password
        }

        const requestOptions = {
            method: "POST",
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify(body)
        }

        try {
            const res = await fetch('/auth/signup', requestOptions)
            const result = await res.json()
            
            if (res.ok) {
                setServerResponse(result.message || "注册成功！")
                setShowSuccess(true)
                reset()
                setTimeout(() => {
                    history.push('/login')
                }, 2000)
            } else {
                setServerResponse(result.message || "注册失败，请重试")
                setShowError(true)
            }
        } catch (err) {
            console.log(err)
            setServerResponse("网络错误，请稍后重试")
            setShowError(true)
        }
    }

    const getPasswordStrength = () => {
        if (password.length < 8) {
            return { level: 0, text: "密码长度不足", class: "text-danger" }
        }
        const hasLetter = /[A-Za-z]/.test(password)
        const hasNumber = /[0-9]/.test(password)
        
        if (hasLetter && hasNumber && password.length >= 12) {
            return { level: 3, text: "强", class: "text-success" }
        } else if (hasLetter && hasNumber) {
            return { level: 2, text: "中等", class: "text-warning" }
        } else {
            return { level: 1, text: "弱", class: "text-danger" }
        }
    }

    const passwordStrength = getPasswordStrength()

    return (
        <div className="container">
            <div className="form">
                <h1 className="mb-4">注册账户</h1>

                {showSuccess && (
                    <Alert variant="success" onClose={() => setShowSuccess(false)} dismissible>
                        <p>{serverResponse}</p>
                        <p className="mb-0">正在跳转到登录页面...</p>
                    </Alert>
                )}

                {showError && (
                    <Alert variant="danger" onClose={() => setShowError(false)} dismissible>
                        {serverResponse}
                    </Alert>
                )}

                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>用户名</Form.Label>
                        <Form.Control type="text"
                            placeholder="请输入用户名"
                            {...register("username", { required: true, maxLength: 25 })}
                        />
                        {errors.username && <p className="text-danger small mt-1 mb-0"><small>用户名是必填项（最多25个字符）</small></p>}
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>邮箱</Form.Label>
                        <Form.Control type="email"
                            placeholder="请输入邮箱地址"
                            {...register("email", { required: true, maxLength: 80 })}
                        />
                        {errors.email && <p className="text-danger small mt-1 mb-0"><small>邮箱是必填项</small></p>}
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>密码</Form.Label>
                        <Form.Control type="password"
                            placeholder="请输入密码"
                            {...register("password", { required: true, minLength: 8 })}
                        />
                        {errors.password && <p className="text-danger small mt-1 mb-0"><small>密码是必填项</small></p>}
                        {errors.password?.type === "minLength" && <p className="text-danger small mt-1 mb-0"><small>密码至少需要8个字符</small></p>}
                        
                        <div className="password-requirements">
                            <p className="mb-1"><strong>密码要求：</strong></p>
                            <ul className="mb-0">
                                <li className={password.length >= 8 ? "text-success" : "text-muted"}>
                                    {password.length >= 8 ? "✓" : "○"} 至少8个字符
                                </li>
                                <li className={/[A-Za-z]/.test(password) ? "text-success" : "text-muted"}>
                                    {/[A-Za-z]/.test(password) ? "✓" : "○"} 包含字母
                                </li>
                                <li className={/[0-9]/.test(password) ? "text-success" : "text-muted"}>
                                    {/[0-9]/.test(password) ? "✓" : "○"} 包含数字
                                </li>
                            </ul>
                        </div>
                        
                        {password.length > 0 && (
                            <div className={`mt-2 small ${passwordStrength.class}`}>
                                密码强度: {passwordStrength.text}
                            </div>
                        )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>确认密码</Form.Label>
                        <Form.Control type="password" placeholder="请再次输入密码"
                            {...register("confirmPassword", { required: true, minLength: 8 })}
                        />
                        {errors.confirmPassword && <p className="text-danger small mt-1 mb-0"><small>请确认密码</small></p>}
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Button variant="primary" onClick={handleSubmit(submitForm)}>
                            注册
                        </Button>
                    </Form.Group>

                    <Form.Group>
                        <small>已有账户？<Link to='/login'>立即登录</Link></small>
                    </Form.Group>
                </Form>
            </div>
        </div>
    )
}

export default SignUpPage
