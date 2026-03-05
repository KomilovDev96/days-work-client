import React, { useState } from 'react';
import { Typography, Button, Table, Space, Tag, Modal, Form, Input, InputNumber, DatePicker, message, Card } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardCards from '../../widgets/dashboard-cards/DashboardCards';
import apiClient from '../../shared/api/apiClient';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const DashboardPage = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingLog, setEditingLog] = useState(null);
    const [form] = Form.useForm();
    const { confirm } = Modal;
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { data, isLoading } = useQuery({
        queryKey: ['my-logs'],
        queryFn: async () => {
            const { data } = await apiClient.get('/daylogs/my');
            return data.data.daylogs;
        },
    });

    const createLogMutation = useMutation({
        mutationFn: (newLog) => apiClient.post('/daylogs', newLog),
        onSuccess: () => {
            queryClient.invalidateQueries(['my-logs']);
            setIsModalVisible(false);
            form.resetFields();
            message.success('Запись за день создана успешно');
        },
        onError: (err) => message.error(err.response?.data?.message || 'Не удалось создать запись'),
    });

    const updateLogMutation = useMutation({
        mutationFn: ({ id, data }) => apiClient.patch(`/daylogs/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['my-logs']);
            setIsModalVisible(false);
            setEditingLog(null);
            form.resetFields();
            message.success('Запись успешно обновлена');
        },
        onError: (err) => message.error(err.response?.data?.message || 'Не удалось обновить запись'),
    });

    const deleteLogMutation = useMutation({
        mutationFn: (id) => apiClient.delete(`/daylogs/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['my-logs']);
            message.success('Запись удалена');
        },
        onError: (err) => message.error(err.response?.data?.message || 'Не удалось удалить запись'),
    });

    const showDeleteConfirm = (id) => {
        confirm({
            title: 'Вы уверены, что хотите удалить этот день?',
            icon: <ExclamationCircleOutlined />,
            content: 'Все задачи этого дня также будут удалены.',
            okText: 'Да, удалить',
            okType: 'danger',
            cancelText: 'Отмена',
            onOk() {
                deleteLogMutation.mutate(id);
            },
        });
    };

    const handleEdit = (log) => {
        setEditingLog(log);
        form.setFieldsValue({
            date: dayjs(log.date)
        });
        setIsModalVisible(true);
    };

    const columns = [
        {
            title: 'Дата',
            dataIndex: 'date',
            key: 'date',
            render: (date) => dayjs(date).format('YYYY-MM-DD'),
        },
        {
            title: 'Всего часов',
            dataIndex: 'totalHours',
            key: 'totalHours',
            render: (hours) => <Tag color="blue">{hours} ч</Tag>,
        },
        {
            title: 'Действия',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/day/${record._id}`)}>
                        Подробнее
                    </Button>
                    <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                        Изм.
                    </Button>
                    <Button type="link" danger icon={<DeleteOutlined />} onClick={() => showDeleteConfirm(record._id)}>
                        Удал.
                    </Button>
                </Space>
            )
        }
    ];

    const onFinish = (values) => {
        const data = { date: values.date.toDate() };
        if (editingLog) {
            updateLogMutation.mutate({ id: editingLog._id, data });
        } else {
            createLogMutation.mutate(data);
        }
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingLog(null);
        form.resetFields();
    };

    return (
        <div style={{ paddingBottom: 24 }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <DashboardCards />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
                    <Title level={3}>Мои записи за день</Title>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
                        Новая запись за день
                    </Button>
                </div>

                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="_id"
                    loading={isLoading}
                    bordered
                />

                <Modal
                    title={editingLog ? "Редактировать запись" : "Создать новую запись за день"}
                    open={isModalVisible}
                    onCancel={handleCancel}
                    footer={null}
                >
                    <Form form={form} layout="vertical" onFinish={onFinish}>
                        <Form.Item
                            name="date"
                            label="Выберите дату"
                            rules={[{ required: true, message: 'Пожалуйста, выберите дату!' }]}
                            initialValue={dayjs()}
                        >
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={createLogMutation.isPending || updateLogMutation.isPending} block>
                                {editingLog ? 'Сохранить' : 'Создать'}
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>
            </Space>
        </div>
    );
};

export default DashboardPage;
