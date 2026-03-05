import React, { useState } from 'react';
import { Layout, Menu, Button, theme, Breadcrumb } from 'antd';
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    DashboardOutlined,
    FileTextOutlined,
    BarChartOutlined,
    TeamOutlined,
    LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../entities/user/model/authSlice';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const menuItems = [
        {
            key: '/dashboard',
            icon: <DashboardOutlined />,
            label: 'Панель',
        },
        {
            key: '/reports',
            icon: <BarChartOutlined />,
            label: 'Отчеты',
        },
    ];

    if (user?.role === 'admin') {
        menuItems.push({
            key: '/users',
            icon: <TeamOutlined />,
            label: 'Пользователи',
        });
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider trigger={null} collapsible collapsed={collapsed} theme="light">
                <div className="demo-logo-vertical" style={{ height: 64, margin: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 20 }}>
                    {collapsed ? 'ДЖ' : 'Дневной журнал'}
                </div>
                <Menu
                    theme="light"
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    onClick={({ key }) => navigate(key)}
                />
            </Sider>
            <Layout>
                <Header style={{ padding: 0, background: colorBgContainer, display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 24 }}>
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{ fontSize: '16px', width: 64, height: 64 }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span>{user?.name} ({user?.role === 'admin' ? 'Админ' : 'Сотрудник'})</span>
                        <Button type="primary" danger icon={<LogoutOutlined />} onClick={handleLogout}>
                            Выйти
                        </Button>
                    </div>
                </Header>
                <Content
                    style={{
                        margin: '24px 16px',
                        padding: 24,
                        minHeight: 280,
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                        overflow: 'auto'
                    }}
                >
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default MainLayout;
