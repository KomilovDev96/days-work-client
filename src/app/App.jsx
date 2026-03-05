import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import ru_RU from 'antd/locale/ru_RU';
import { store } from './providers/store';
import { QueryProvider } from './providers/QueryProvider';
import MainLayout from './providers/MainLayout';
import ProtectedRoute from '../shared/lib/ProtectedRoute';
import LoginPage from '../pages/login/LoginPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import DayLogDetailsPage from '../pages/day-log/DayLogDetailsPage';
import ReportsPage from '../pages/reports/ReportsPage';
import UsersPage from '../pages/users/UsersPage';
import './styles/index.css';

const App = () => {
    return (
        <Provider store={store}>
            <ConfigProvider locale={ru_RU}>
                <QueryProvider>
                    <BrowserRouter>
                        <Routes>
                            <Route path="/login" element={<LoginPage />} />

                            <Route element={<ProtectedRoute />}>
                                <Route element={<MainLayout />}>
                                    <Route path="/dashboard" element={<DashboardPage />} />
                                    <Route path="/day/:id" element={<DayLogDetailsPage />} />
                                    <Route path="/reports" element={<ReportsPage />} />
                                    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                                        <Route path="/users" element={<UsersPage />} />
                                    </Route>
                                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                                </Route>
                            </Route>

                            <Route path="*" element={<Navigate to="/login" replace />} />
                        </Routes>
                    </BrowserRouter>
                </QueryProvider>
            </ConfigProvider>
        </Provider>
    );
};

export default App;
