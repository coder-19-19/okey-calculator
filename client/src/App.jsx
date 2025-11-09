import { Button, Card, Form, Input, Layout, Typography, Space, ConfigProvider, } from "antd";
import { io } from "socket.io-client";
import { useEffect, useState } from "react";
import Grid from "./grid.jsx";
import { LogoutOutlined, TeamOutlined, UserOutlined } from "@ant-design/icons";

const { Content } = Layout;
const { Title, Text } = Typography;

const socket = io(import.meta.env.VITE_APP_SOCKET_URL || "http://localhost:3001");

function App() {
  const [form] = Form.useForm();
  const params = Form.useWatch([], form);
  const localRoomName = localStorage.getItem('roomName');
  const [joined, setJoined] = useState(!!localRoomName);
  const [name, setName] = useState(localStorage.getItem('name') || '');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('connect_error', () => {
      setConnected(false);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
    };
  }, []);

  const joinRoom = async () => {
    try {
      if (!params?.roomName || !params?.name) {
        return;
      }

      setLoading(true);
      socket.emit("joinRoom", params.roomName);
      localStorage.setItem('roomName', params.roomName);
      localStorage.setItem('name', params.name);
      setName(params.name);
      setJoined(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (localRoomName && !joined) {
      socket.emit("joinRoom", localRoomName);
    }
  }, []);

  const leaveRoom = () => {
    socket.emit("leaveRoom", localRoomName);
    localStorage.clear();
    setJoined(false);
    setName('');
    form.resetFields();
  };

  return (
    <ConfigProvider
    >
      <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
        <Content style={{ padding: '24px' }}>
          {joined ? (
            <div className="fade-in">
              <Card
                style={{
                  marginBottom: '24px',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Space
                  direction="vertical"
                  size="large"
                  style={{ width: '100%' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <Space>
                      <TeamOutlined style={{ fontSize: '24px', color: '#667eea' }} />
                      <Title level={2} style={{ margin: 0, color: '#1a1a1a' }}>
                        {localRoomName}
                      </Title>
                    </Space>
                    <Space>
                      <UserOutlined style={{ color: '#667eea' }} />
                      <Text strong style={{ color: '#1a1a1a' }}>{name}</Text>
                      <Button
                        type="primary"
                        danger
                        icon={<LogoutOutlined />}
                        onClick={leaveRoom}
                        style={{ borderRadius: '8px' }}
                      >
                        Ayrıl
                      </Button>
                    </Space>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: connected ? '#52c41a' : '#ff4d4f',
                        animation: connected ? 'pulse 2s infinite' : 'none',
                      }}
                    />
                    <Text type="secondary" style={{ color: '#666' }}>
                      {connected ? 'Bağlı' : 'Bağlantı yoxdur'}
                    </Text>
                  </div>
                </Space>
              </Card>
              <Grid socket={socket} room={localRoomName} name={name} />
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '80vh',
              }}
              className="fade-in"
            >
              <Card
                style={{
                  width: '100%',
                  maxWidth: '500px',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                }}
                title={
                  <div style={{ textAlign: 'center' }}>
                    <TeamOutlined style={{ fontSize: '32px', color: '#667eea', marginBottom: '8px' }} />
                    <Title level={3} style={{ margin: 0, color: '#1a1a1a' }}>
                      Okey
                    </Title>
                  </div>
                }
              >
                <Form
                  onFinish={joinRoom}
                  form={form}
                  layout="vertical"
                  size="large"
                  autoComplete="off"
                >
                  <Form.Item
                    label={<Text strong style={{ color: '#1a1a1a' }}>Ad</Text>}
                    name="name"
                    rules={[
                      { required: true, message: 'Adını gir cyka!' },
                      { min: 3, message: '2 hərfli ad olur bled?!' },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="Adınızı girin"
                      style={{ borderRadius: '8px' }}
                    />
                  </Form.Item>
                  <Form.Item
                    label={<Text strong style={{ color: '#1a1a1a' }}>Otaq Adı</Text>}
                    name="roomName"
                    rules={[
                      { required: true, message: 'Otaq adını yaz!' },
                      { min: 3, message: 'Otaq adı ən az 3 hərfli olmalıdır!' },
                    ]}
                  >
                    <Input
                      prefix={<TeamOutlined />}
                      placeholder="Otaq adını girin"
                      style={{ borderRadius: '8px' }}
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      block
                      loading={loading}
                      disabled={!params?.roomName || !params?.name || !connected}
                      style={{
                        height: '48px',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                      }}
                    >
                      {loading ? 'Giriş edilir...' : 'Otağa Qoşul'}
                    </Button>
                  </Form.Item>
                  {!connected && (
                    <div style={{ textAlign: 'center', marginTop: '8px' }}>
                      <Text type="danger">Error.</Text>
                    </div>
                  )}
                </Form>
              </Card>
            </div>
          )}
        </Content>
      </Layout>
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </ConfigProvider>
  );
}

export default App;
