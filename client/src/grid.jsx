import { useEffect, useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import {Button, Card, Space, Statistic, Row, Col, Typography, Badge, Divider, Table, Modal, Form, InputNumber, Input} from "antd";
import { SendOutlined, TrophyOutlined, TeamOutlined, SwapOutlined, EditOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Title } = Typography;

function Grid({ socket, room, name }) {
  const localData = localStorage.getItem("data");
  const [data, setData] = useState(
    localData
      ? JSON.parse(localData)
      : [
          { id: uuidv4(), no: 1 },
          { id: uuidv4(), no: 2 },
          { id: uuidv4(), no: 3 },
          { id: uuidv4(), no: 4 },
          { id: uuidv4(), no: 5 },
        ]
  );
  const [sending, setSending] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  const sendData = async () => {
    try {
      setSending(true);
      socket.emit('sendData', {
        room,
        data,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    const handleReceiveData = (receivedData) => {
      if (receivedData?.data) {
        setData(receivedData.data);
        localStorage.setItem("data", JSON.stringify(receivedData.data));
      }
    };

    socket.on("receiveData", handleReceiveData);

    return () => {
      socket.off("receiveData", handleReceiveData);
    };
  }, [socket]);

  const firstTeamPoint = () => {
    return (
      data.reduce((prev, curr) => {
        return prev + ((curr?.point1 || 0) + (curr?.punish1 || 0));
      }, 0) || 0
    );
  };

  const secondTeamPoint = () => {
    return (
      data.reduce((prev, curr) => {
        return prev + ((curr?.point2 || 0) + (curr?.punish2 || 0));
      }, 0) || 0
    );
  };

  const winner = firstTeamPoint() < secondTeamPoint() ? 1 : 2;
  const difference = Math.abs(firstTeamPoint() - secondTeamPoint());
  const isFirstTeamLeading = firstTeamPoint() < secondTeamPoint();

  const columnGenerator = (key, name, title, options = {}) => ({
    key,
    dataIndex: name,
    title,
    ...options
  });

  const evaluateExpression = (value) => {
    if (!value || value === '') return 0;
    
    if (typeof value === 'number') return value;
    
    const str = String(value).trim();
    
    if (!str) return 0;
    
    if (/^-?\d+\.?\d*$/.test(str)) {
      return parseFloat(str) || 0;
    }
    
    try {
      const sanitized = str.replace(/[^0-9+\-*/().\s]/g, '');
      if (!sanitized) return 0;
      
      const result = eval(sanitized);
      return typeof result === 'number' ? result : parseFloat(result) || 0;
    } catch (error) {
      console.error('Expression evaluation error:', error);
      return 0;
    }
  };

  const handleInputBlur = (fieldName, value) => {
    const stringValue = value !== null && value !== undefined ? String(value).trim() : '';
    if (stringValue) {
      const evaluatedValue = evaluateExpression(stringValue);
      form.setFieldsValue({ [fieldName]: evaluatedValue });
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      user1Point: record.user1Point || 0,
      user1Punish: record.user1Punish || 0,
      user2Point: record.user2Point || 0,
      user2Punish: record.user2Punish || 0,
      user3Point: record.user3Point || 0,
      user3Punish: record.user3Punish || 0,
      user4Point: record.user4Point || 0,
      user4Punish: record.user4Punish || 0,
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      const cleanedValues = {
        user1Point: evaluateExpression(values.user1Point),
        user1Punish: evaluateExpression(values.user1Punish),
        user2Point: evaluateExpression(values.user2Point),
        user2Punish: evaluateExpression(values.user2Punish),
        user3Point: evaluateExpression(values.user3Point),
        user3Punish: evaluateExpression(values.user3Punish),
        user4Point: evaluateExpression(values.user4Point),
        user4Punish: evaluateExpression(values.user4Punish),
      };

      const point1 = cleanedValues.user1Point + cleanedValues.user2Point;
      const punish1 = cleanedValues.user1Punish + cleanedValues.user2Punish;
      const point2 = cleanedValues.user3Point + cleanedValues.user4Point;
      const punish2 = cleanedValues.user3Punish + cleanedValues.user4Punish;

      const updatedData = data.map((item) => {
        if (item.id === editingRecord.id) {
          const updatedItem = {
            ...item,
            ...cleanedValues,
            point1: point1,
            punish1: punish1,
            point2: point2,
            punish2: punish2,
            modifiedBy: name,
            modifiedDate: dayjs(new Date()).format('DD.MM.YYYY HH:mm'),
          };
          return updatedItem;
        }
        return item;
      });
      setData(updatedData);
      localStorage.setItem("data", JSON.stringify(updatedData));
      setIsModalOpen(false);
      setEditingRecord(null);
      form.resetFields();
    });
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const columns = [
    columnGenerator('no', 'no', 'No', { 
      fixed: 'left',
      width: 80,
      align: 'center'
    }),
    {
      title: 'Əməliyyat',
      key: 'action',
      fixed: 'left',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EditOutlined />}
          size="small"
          onClick={() => handleEdit(record)}
          style={{ borderRadius: '6px' }}
        />
      ),
    },
    {
      title: '1. Komanda',
      children: [
        columnGenerator('point1', 'point1', 'Xal', { align: 'center' }),
        columnGenerator('punish1', 'punish1', 'Cərimə', { align: 'center' }),
        columnGenerator('user1Point', 'user1Point', '1. Oyunçunun Xalı', { align: 'center' }),
        columnGenerator('user1Punish', 'user1Punish', '1. Oyunçunun Cəriməsi', { align: 'center' }),
        columnGenerator('user2Point', 'user2Point', '2. Oyunçunun Xalı', { align: 'center' }),
        columnGenerator('user2Punish', 'user2Punish', '2. Oyunçunun Cəriməsi', { align: 'center' }),
      ],
    },
    {
      title: '2. Komanda',
      children: [
        columnGenerator('point2', 'point2', 'Xal', { align: 'center' }),
        columnGenerator('punish2', 'punish2', 'Cərimə', { align: 'center' }),
        columnGenerator('user3Point', 'user3Point', '1. Oyunçunun Xalı', { align: 'center' }),
        columnGenerator('user3Punish', 'user3Punish', '1. Oyunçunun Cəriməsi', { align: 'center' }),
        columnGenerator('user4Point', 'user4Point', '2. Oyunçunun Xalı', { align: 'center' }),
        columnGenerator('user4Punish', 'user4Punish', '2. Oyunçunun Cəriməsi', { align: 'center' }),
      ],
    },
    columnGenerator('modifiedBy', 'modifiedBy', 'Dəyişdirən', { align: 'center' }),
    columnGenerator('modifiedDate', 'modifiedDate', 'Tarix', { align: 'center' }),
  ]
        
  return (
    <div>
      <Card
        style={{
          marginBottom: '24px',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <Title level={4} style={{ margin: 0, color: '#1a1a1a' }}>
              <TrophyOutlined style={{ marginRight: '8px', color: '#667eea' }} />
              Hesab
            </Title>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={sendData}
              loading={sending}
              size="large"
              style={{ borderRadius: '8px' }}
            >
              Göndər
            </Button>
          </div>
          
          <div style={{
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            margin: '16px 0'
          }}>
            <Badge.Ribbon 
              text={
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <SwapOutlined />
                  Fərq
                </span>
              }
              color={difference > 0 ? (isFirstTeamLeading ? '#52c41a' : '#1890ff') : '#667eea'}
              style={{ 
                fontSize: '16px',
              }}
            >
              <Card
                style={{
                  background: difference > 0 
                    ? (isFirstTeamLeading 
                        ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)' 
                        : 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)')
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: difference > 0 
                    ? (isFirstTeamLeading 
                        ? '0 4px 16px rgba(82, 196, 26, 0.3)' 
                        : '0 4px 16px rgba(24, 144, 255, 0.3)')
                    : '0 4px 16px rgba(102, 126, 234, 0.3)',
                  minWidth: '240px',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  animation: difference > 0 ? 'pulse 2s ease-in-out infinite' : 'none',
                }}
                bodyStyle={{
                  padding: '20px 32px',
                }}
              >
                <div style={{ marginBottom: '8px' }}>
                  {difference > 0 && (
                    <Typography.Text 
                      strong 
                      style={{ 
                        color: '#fff', 
                        fontSize: '14px',
                        textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                        display: 'block',
                        marginBottom: '4px'
                      }}
                    >
                      {isFirstTeamLeading ? '1. Komanda öndə' : '2. Komanda öndə'}
                    </Typography.Text>
                  )}
                  {difference === 0 && (
                    <Typography.Text 
                      strong 
                      style={{ 
                        color: '#fff', 
                        fontSize: '14px',
                        textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                        display: 'block',
                        marginBottom: '4px'
                      }}
                    >
                      Bərabər
                    </Typography.Text>
                  )}
                </div>
                <Statistic
                  value={difference}
                  valueStyle={{
                    color: '#fff',
                    fontSize: '36px',
                    fontWeight: 'bold',
                    textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    lineHeight: '1.2',
                  }}
                  suffix={
                    <span style={{ 
                      color: '#fff', 
                      fontSize: '20px',
                      opacity: 0.95,
                      fontWeight: '500'
                    }}>
                      xal
                    </span>
                  }
                />
              </Card>
            </Badge.Ribbon>
          </div>

          <Divider style={{ margin: '24px 0' }} />

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Card
                style={{
                  background: winner === 1 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255, 255, 255, 0.9)',
                  border: winner === 1 ? '2px solid #667eea' : '1px solid #d9d9d9',
                  borderRadius: '12px',
                }}
              >
                <Statistic
                  title={
                    <span style={{ color: winner === 1 ? '#fff' : '#1a1a1a', fontWeight: 'bold' }}>
                      <TeamOutlined style={{ marginRight: '8px' }} />
                      1. Komandanın Xalı
                    </span>
                  }
                  value={firstTeamPoint()}
                  valueStyle={{
                    color: winner === 1 ? '#fff' : '#667eea',
                    fontSize: '32px',
                    fontWeight: 'bold',
                  }}
                  prefix={winner === 1 ? <TrophyOutlined /> : null}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card
                style={{
                  background: winner === 2 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255, 255, 255, 0.9)',
                  border: winner === 2 ? '2px solid #667eea' : '1px solid #d9d9d9',
                  borderRadius: '12px',
                }}
              >
                <Statistic
                  title={
                    <span style={{ color: winner === 2 ? '#fff' : '#1a1a1a', fontWeight: 'bold' }}>
                      <TeamOutlined style={{ marginRight: '8px' }} />
                      2. Komandanın Xalı
                    </span>
                  }
                  value={secondTeamPoint()}
                  valueStyle={{
                    color: winner === 2 ? '#fff' : '#667eea',
                    fontSize: '32px',
                    fontWeight: 'bold',
                  }}
                  prefix={winner === 2 ? <TrophyOutlined /> : null}
                />
              </Card>
            </Col>
          </Row>
        </Space>
      </Card>

      <Card
        style={{
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          overflow: 'auto',
        }}
        bodyStyle={{
          padding: '12px',
          overflowX: 'auto',
          overflowY: 'visible',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Table 
          pagination={false} 
          columns={columns} 
          dataSource={data}
          rowKey="id"
          scroll={{ x: 'max-content' }}
          bordered
        />
      </Card>

      <Modal
        title="Redaktə Et"
        open={isModalOpen}
        onOk={handleSave}
        onCancel={handleCancel}
        okText="Yadda saxla"
        cancelText="Ləğv et"
        width={700}
        style={{ top: 20 }}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: '20px' }}
        >
          {/* 1. Komanda */}
          <div style={{ marginBottom: '24px' }}>
            <Typography.Title level={5} style={{ marginBottom: '16px', color: '#667eea' }}>
              <TeamOutlined style={{ marginRight: '8px' }} />
              1. Komanda
            </Typography.Title>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="1. Oyunçunun Xalı"
                  name="user1Point"
                  rules={[{ required: false, message: 'Xalı daxil edin' }]}
                >
                  <Input
                    style={{ width: '100%' }}
                    placeholder="Xal (məs: 10+5, 2*3)"
                    onBlur={(e) => {
                      const value = e.target.value;
                      handleInputBlur('user1Point', value);
                    }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="1. Oyunçunun Cəriməsi"
                  name="user1Punish"
                  rules={[{ required: false, message: 'Cəriməni daxil edin' }]}
                >
                  <Input
                    style={{ width: '100%' }}
                    placeholder="Cərimə (məs: 10+5, 2*3)"
                    onBlur={(e) => {
                      const value = e.target.value;
                      handleInputBlur('user1Punish', value);
                    }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="2. Oyunçunun Xalı"
                  name="user2Point"
                  rules={[{ required: false, message: 'Xalı daxil edin' }]}
                >
                  <Input
                    style={{ width: '100%' }}
                    placeholder="Xal (məs: 10+5, 2*3)"
                    onBlur={(e) => {
                      const value = e.target.value;
                      handleInputBlur('user2Point', value);
                    }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="2. Oyunçunun Cəriməsi"
                  name="user2Punish"
                  rules={[{ required: false, message: 'Cəriməni daxil edin' }]}
                >
                  <Input
                    style={{ width: '100%' }}
                    placeholder="Cərimə (məs: 10+5, 2*3)"
                    onBlur={(e) => {
                      const value = e.target.value;
                      handleInputBlur('user2Punish', value);
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <Divider />

          {/* 2. Komanda */}
          <div style={{ marginBottom: '24px' }}>
            <Typography.Title level={5} style={{ marginBottom: '16px', color: '#667eea' }}>
              <TeamOutlined style={{ marginRight: '8px' }} />
              2. Komanda
            </Typography.Title>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="1. Oyunçunun Xalı"
                  name="user3Point"
                  rules={[{ required: false, message: 'Xalı daxil edin' }]}
                >
                  <Input
                    style={{ width: '100%' }}
                    placeholder="Xal (məs: 10+5, 2*3)"
                    onBlur={(e) => {
                      const value = e.target.value;
                      handleInputBlur('user3Point', value);
                    }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="1. Oyunçunun Cəriməsi"
                  name="user3Punish"
                  rules={[{ required: false, message: 'Cəriməni daxil edin' }]}
                >
                  <Input
                    style={{ width: '100%' }}
                    placeholder="Cərimə (məs: 10+5, 2*3)"
                    onBlur={(e) => {
                      const value = e.target.value;
                      handleInputBlur('user3Punish', value);
                    }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="2. Oyunçunun Xalı"
                  name="user4Point"
                  rules={[{ required: false, message: 'Xalı daxil edin' }]}
                >
                  <Input
                    style={{ width: '100%' }}
                    placeholder="Xal (məs: 10+5, 2*3)"
                    onBlur={(e) => {
                      const value = e.target.value;
                      handleInputBlur('user4Point', value);
                    }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="2. Oyunçunun Cəriməsi"
                  name="user4Punish"
                  rules={[{ required: false, message: 'Cəriməni daxil edin' }]}
                >
                  <Input
                    style={{ width: '100%' }}
                    placeholder="Cərimə (məs: 10+5, 2*3)"
                    onBlur={(e) => {
                      const value = e.target.value;
                      handleInputBlur('user4Punish', value);
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

export default Grid;
