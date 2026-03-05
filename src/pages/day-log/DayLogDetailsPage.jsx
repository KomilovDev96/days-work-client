import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Typography, Card, List, Button, Tag, Space, Divider,
    Modal, Form, Input, InputNumber, Select, Upload, message, Tooltip, Empty
} from 'antd';
import {
    PlusOutlined, UploadOutlined, FileTextOutlined,
    ClockCircleOutlined, DeleteOutlined, ArrowLeftOutlined,
    EditOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../shared/api/apiClient';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const DayLogDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState([]);

    const { data: log, isLoading } = useQuery({
        queryKey: ['day-log', id],
        queryFn: async () => {
            const { data } = await apiClient.get(`/daylogs/${id}`);
            return data.data.daylog;
        },
    });

    const addTaskMutation = useMutation({
        mutationFn: (newTask) => apiClient.post('/tasks', { ...newTask, dayLogId: id }),
        onSuccess: (resp) => {
            const taskId = resp.data.data.task._id;
            // If there are files, upload them
            if (fileList.length > 0) {
                uploadFiles(taskId);
            } else {
                queryClient.invalidateQueries(['day-log', id]);
                setIsModalVisible(false);
                form.resetFields();
                setFileList([]);
                message.success('Задача успешно добавлена');
            }
        },
        onError: (err) => message.error(err.response?.data?.message || 'Не удалось добавить задачу'),
    });

    const updateTaskMutation = useMutation({
        mutationFn: ({ taskId, data }) => apiClient.patch(`/tasks/${taskId}`, data),
        onSuccess: (resp) => {
            const taskId = resp.data.data.task._id;
            if (fileList.length > 0) {
                uploadFiles(taskId);
            } else {
                queryClient.invalidateQueries(['day-log', id]);
                setIsModalVisible(false);
                setEditingTask(null);
                form.resetFields();
                message.success('Задача обновлена');
            }
        },
        onError: (err) => message.error(err.response?.data?.message || 'Не удалось обновить задачу'),
    });

    const deleteFileMutation = useMutation({
        mutationFn: (fileId) => apiClient.delete(`/files/${fileId}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['day-log', id]);
            message.success('Файл удален');
        },
        onError: (err) => message.error(err.response?.data?.message || 'Не удалось удалить файл'),
    });

    const uploadFiles = async (taskId) => {
        try {
            const promises = fileList.map(item => {
                const formData = new FormData();
                formData.append('file', item);
                formData.append('taskId', taskId);
                formData.append('title', item.name);
                return apiClient.post('/files/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            });
            await Promise.all(promises);
            queryClient.invalidateQueries(['day-log', id]);
            setIsModalVisible(false);
            form.resetFields();
            setFileList([]);
            message.success('Задача и файлы успешно загружены');
        } catch (error) {
            message.error('Задача добавлена, но некоторые файлы не удалось загрузить');
        }
    };

    const deleteTaskMutation = useMutation({
        mutationFn: (taskId) => apiClient.delete(`/tasks/${taskId}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['day-log', id]);
            message.success('Задача удалена');
        },
        onError: (err) => message.error(err.response?.data?.message || 'Не удалось удалить задачу'),
    });

    if (isLoading) return <Card loading />;

    const onFinish = (values) => {
        if (editingTask) {
            updateTaskMutation.mutate({ taskId: editingTask._id, data: values });
        } else {
            addTaskMutation.mutate(values);
        }
    };

    const handleEdit = (task) => {
        setEditingTask(task);
        form.setFieldsValue({
            title: task.title,
            description: task.description,
            hours: task.hours,
            status: task.status,
            comment: task.comment,
        });
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingTask(null);
        form.resetFields();
        setFileList([]);
    };

    const getStatusTag = (status) => {
        switch (status) {
            case 'completed': return <Tag color="success">Выполнено</Tag>;
            case 'failed': return <Tag color="error">Не выполнено</Tag>;
            default: return <Tag color="processing">В процессе</Tag>;
        }
    };

    const uploadProps = {
        onRemove: (file) => {
            const index = fileList.indexOf(file);
            const newFileList = fileList.slice();
            newFileList.splice(index, 1);
            setFileList(newFileList);
        },
        beforeUpload: (file) => {
            setFileList([...fileList, file]);
            return false;
        },
        fileList,
    };

    return (
        <div>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard')} style={{ marginBottom: 16 }}>
                Назад к панели
            </Button>

            <Card title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={4} style={{ margin: 0 }}>
                        Журнал работы: {dayjs(log?.date).format('MMMM D, YYYY')}
                    </Title>
                    <Tag color="cyan" icon={<ClockCircleOutlined />}>
                        Всего: {log?.totalHours} часов
                    </Tag>
                </div>
            }>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <Title level={5}>Список задач</Title>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
                        Добавить задачу
                    </Button>
                </div>

                <List
                    itemLayout="vertical"
                    dataSource={log?.tasks}
                    locale={{ emptyText: <Empty description="Нет задач на этот день" /> }}
                    renderItem={(task) => (
                        <List.Item
                            key={task._id}
                            extra={
                                <Space>
                                    <Tooltip title="Редактировать задачу">
                                        <Button
                                            type="text"
                                            icon={<EditOutlined />}
                                            onClick={() => handleEdit(task)}
                                        />
                                    </Tooltip>
                                    <Tooltip title="Удалить задачу">
                                        <Button
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => deleteTaskMutation.mutate(task._id)}
                                        />
                                    </Tooltip>
                                </Space>
                            }
                        >
                            <List.Item.Meta
                                avatar={<FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                                title={<strong>{task.title}</strong>}
                                description={
                                    <Space direction="vertical" style={{ width: '100%' }}>
                                        <Space>
                                            <Tag color="gold">{task.hours} ч</Tag>
                                            <Text type="secondary">{dayjs(task.createdAt).format('HH:mm')}</Text>
                                            {getStatusTag(task.status)}
                                        </Space>
                                    </Space>
                                }
                            />
                            <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
                                {task.description}
                            </Typography.Paragraph>
                            {task.comment && (
                                <div style={{ borderLeft: '3px solid #f0f0f0', paddingLeft: 8, marginBottom: 8 }}>
                                    <Text type="secondary" italic>Комментарий: {task.comment}</Text>
                                </div>
                            )}

                            {task.files && task.files.length > 0 && (
                                <div style={{ marginTop: 8 }}>
                                    <Text strong>Вложения:</Text>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                                        {task.files.map(file => (
                                            <Tag
                                                icon={<UploadOutlined />}
                                                key={file._id}
                                                color="processing"
                                                closable
                                                onClose={(e) => {
                                                    e.preventDefault();
                                                    Modal.confirm({
                                                        title: 'Удалить файл?',
                                                        content: 'Вы уверены, что хотите удалить этот файл?',
                                                        okText: 'Да',
                                                        cancelText: 'Нет',
                                                        onOk: () => deleteFileMutation.mutate(file._id)
                                                    });
                                                }}
                                            >
                                                <a href={`http://localhost:5000/${file.fileUrl}`} target="_blank" rel="noopener noreferrer">
                                                    {file.title}
                                                </a>
                                            </Tag>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </List.Item>
                    )}
                />
            </Card>

            <Modal
                title={editingTask ? "Редактировать задачу" : "Добавить новую задачу"}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                width={600}
            >
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item name="title" label="Название задачи" rules={[{ required: true, message: 'Пожалуйста, введите название задачи' }]}>
                        <Input placeholder="напр. Реализация модуля авторизации" />
                    </Form.Item>
                    <Form.Item name="description" label="Описание задачи">
                        <Input.TextArea rows={4} placeholder="Опишите, что вы сделали..." />
                    </Form.Item>
                    <Form.Item name="hours" label="Затрачено часов" rules={[{ required: true, message: 'Пожалуйста, введите количество часов' }]}>
                        <InputNumber min={0.5} max={24} step={0.5} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item name="status" label="Статус задачи" initialValue="pending">
                        <Select>
                            <Select.Option value="pending">В процессе</Select.Option>
                            <Select.Option value="completed">Выполнено</Select.Option>
                            <Select.Option value="failed">Не выполнено</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item name="comment" label="Комментарий / Результат">
                        <Input.TextArea rows={2} placeholder="Введите комментарий или почему задача не выполнена..." />
                    </Form.Item>

                    <Divider orientation="left">Загрузить файлы {editingTask && '(Новые)'}</Divider>
                    <Form.Item label="Вложения">
                        <Upload {...uploadProps} listType="text" multiple>
                            <Button icon={<UploadOutlined />}>Выбрать файлы</Button>
                        </Upload>
                    </Form.Item>

                    <Form.Item style={{ marginTop: 24 }}>
                        <Button type="primary" htmlType="submit" loading={addTaskMutation.isPending || updateTaskMutation.isPending} block size="large">
                            {editingTask ? 'Сохранить изменения' : 'Отправить задачу'}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default DayLogDetailsPage;
