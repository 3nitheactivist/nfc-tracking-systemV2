import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Form, Input, Button, Select, Table, Space, 
  Popconfirm, message, Modal, Tabs, Tag, Typography, Empty 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, UserAddOutlined, 
  UserDeleteOutlined, SearchOutlined, ScanOutlined 
} from '@ant-design/icons';
import { hostelService } from '../../utils/firebase/hostelService';
import { studentService } from '../../utils/firebase/studentService';

const { Option } = Select;
const { TabPane } = Tabs;
const { Text } = Typography;

function HostelAssignment() {
  const [loading, setLoading] = useState(false);
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [isHostelModalVisible, setIsHostelModalVisible] = useState(false);
  const [isRoomModalVisible, setIsRoomModalVisible] = useState(false);
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [editingHostel, setEditingHostel] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [hostelForm] = Form.useForm();
  const [roomForm] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [scanning, setScanning] = useState(false);
  
  useEffect(() => {
    loadHostels();
    loadStudents();
  }, []);
  
  useEffect(() => {
    if (selectedHostel) {
      loadRooms(selectedHostel);
    } else {
      setRooms([]);
    }
  }, [selectedHostel]);
  
  useEffect(() => {
    // Filter students based on search text
    if (searchText) {
      const filtered = students.filter(student => 
        student.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        student.id?.toLowerCase().includes(searchText.toLowerCase()) ||
        student.studentId?.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [searchText, students]);
  
  const loadHostels = async () => {
    try {
      setLoading(true);
      const hostelsData = await hostelService.getHostels();
      setHostels(hostelsData);
      
      // Set first hostel as selected if available
      if (hostelsData.length > 0 && !selectedHostel) {
        setSelectedHostel(hostelsData[0].id);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading hostels:', error);
      message.error('Failed to load hostels');
      setLoading(false);
    }
  };
  
  const loadRooms = async (hostelId) => {
    try {
      setLoading(true);
      const roomsData = await hostelService.getHostelRooms(hostelId);
      setRooms(roomsData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading rooms:', error);
      message.error('Failed to load rooms');
      setLoading(false);
    }
  };
  
  const loadStudents = async () => {
    try {
      const studentsData = await studentService.getAllStudents();
      setStudents(studentsData);
      setFilteredStudents(studentsData);
    } catch (error) {
      console.error('Error loading students:', error);
      message.error('Failed to load students');
    }
  };
  
  // Simplified NFC scanning functions
  const startScan = () => {
    setScanning(true);
    message.info('Scanning for NFC card...');
    // In a real implementation, you would start the NFC scanning here
    // For demo purposes, we'll simulate finding a card after a delay
    setTimeout(() => {
      stopScan();
      message.success('NFC card detected!');
      // You would handle the actual NFC ID here
    }, 2000);
  };
  
  const stopScan = () => {
    setScanning(false);
  };
  
  // Hostel CRUD operations
  const showAddHostelModal = () => {
    setEditingHostel(null);
    hostelForm.resetFields();
    setIsHostelModalVisible(true);
  };
  
  const showEditHostelModal = (hostel) => {
    setEditingHostel(hostel);
    hostelForm.setFieldsValue({
      name: hostel.name,
      description: hostel.description,
      gender: hostel.gender
    });
    setIsHostelModalVisible(true);
  };
  
  const handleHostelFormSubmit = async (values) => {
    try {
      setLoading(true);
      
      // Before saving to Firestore, ensure no undefined values
      // Option 1: Remove undefined values
      const cleanedValues = Object.fromEntries(
        Object.entries(values).filter(([_, v]) => v !== undefined)
      );
      
      // Option 2: Replace undefined with null or empty string
      const sanitizedValues = {
        ...cleanedValues,
        // Replace undefined description with empty string
        description: cleanedValues.description || '',
        // Check other fields that might be undefined
        name: cleanedValues.name || '',
        location: cleanedValues.location || '',
        // Add any other fields that might be undefined
      };
      
      if (editingHostel) {
        // Update existing hostel
        await hostelService.updateHostel(editingHostel.id, sanitizedValues);
        message.success('Hostel updated successfully');
      } else {
        // Add new hostel
        await hostelService.addHostel(sanitizedValues);
        message.success('Hostel added successfully');
      }
      
      setIsHostelModalVisible(false);
      loadHostels();
      setLoading(false);
    } catch (error) {
      console.error('Error saving hostel:', error);
      message.error('Failed to save hostel');
      setLoading(false);
    }
  };
  
  const handleDeleteHostel = async (hostelId) => {
    try {
      setLoading(true);
      await hostelService.deleteHostel(hostelId);
      message.success('Hostel deleted successfully');
      loadHostels();
      setLoading(false);
    } catch (error) {
      console.error('Error deleting hostel:', error);
      message.error('Failed to delete hostel');
      setLoading(false);
    }
  };
  
  // Room CRUD operations
  const showAddRoomModal = () => {
    setEditingRoom(null);
    roomForm.resetFields();
    roomForm.setFieldsValue({ hostelId: selectedHostel });
    setIsRoomModalVisible(true);
  };
  
  const showEditRoomModal = (room) => {
    setEditingRoom(room);
    roomForm.setFieldsValue({
      hostelId: room.hostelId,
      roomNumber: room.roomNumber,
      floor: room.floor,
      capacity: room.capacity,
      type: room.type
    });
    setIsRoomModalVisible(true);
  };
  
  const handleRoomFormSubmit = async (values) => {
    try {
      setLoading(true);
      
      if (editingRoom) {
        // Update existing room
        await hostelService.updateRoom(editingRoom.id, values);
        message.success('Room updated successfully');
      } else {
        // Add new room
        await hostelService.addRoom(values);
        message.success('Room added successfully');
      }
      
      setIsRoomModalVisible(false);
      loadRooms(selectedHostel);
      setLoading(false);
    } catch (error) {
      console.error('Error saving room:', error);
      message.error('Failed to save room');
      setLoading(false);
    }
  };
  
  const handleDeleteRoom = async (roomId) => {
    try {
      setLoading(true);
      await hostelService.deleteRoom(roomId);
      message.success('Room deleted successfully');
      loadRooms(selectedHostel);
      setLoading(false);
    } catch (error) {
      console.error('Error deleting room:', error);
      message.error('Failed to delete room');
      setLoading(false);
    }
  };
  
  // Student assignment operations
  const showAssignModal = (room) => {
    setSelectedRoom(room);
    assignForm.resetFields();
    setIsAssignModalVisible(true);
  };
  
  const handleAssignStudent = async (values) => {
    try {
      setLoading(true);
      
      // Get the student details
      const student = students.find(s => s.id === values.studentId);
      if (!student) {
        message.error('Student not found');
        setLoading(false);
        return;
      }
      
      // Get the room details
      const room = rooms.find(r => r.id === selectedRoom.id);
      if (!room) {
        message.error('Room not found');
        setLoading(false);
        return;
      }
      
      // Check if the room is at capacity
      if (room.occupants && room.occupants.length >= room.capacity) {
        message.warning('This room is already at full capacity');
        setLoading(false);
        return;
      }
      
      // Check if student is already assigned to any room
      if (student.hostelAssignment) {
        // If assigned to the same room, show specific message
        if (student.hostelAssignment.roomId === selectedRoom.id) {
          message.warning(`${student.name} is already assigned to this room`);
        } else {
          // If assigned to a different room, show that information
          message.warning(
            `${student.name} is already assigned to room ${student.hostelAssignment.roomNumber} in ${
              hostels.find(h => h.id === student.hostelAssignment.hostelId)?.name || 'another hostel'
            }`
          );
        }
        setLoading(false);
        return;
      }
      
      // Check if student is already in the room's occupants list
      const alreadyAssigned = room.occupants && room.occupants.some(s => s.id === values.studentId);
      if (alreadyAssigned) {
        message.warning(`${student.name} is already assigned to this room`);
        setLoading(false);
        return;
      }
      
      // Proceed with assignment if all checks pass
      await hostelService.assignStudentToRoom(selectedRoom.id, values.studentId);
      
      message.success(`Student assigned to room ${selectedRoom.roomNumber} successfully`);
      
      // Refresh data
      loadRooms(selectedHostel);
      loadStudents();
      
      // Close modal
      setIsAssignModalVisible(false);
      assignForm.resetFields();
    } catch (error) {
      console.error('Error assigning student:', error);
      message.error('Failed to assign student: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };
  
  const handleRemoveStudent = async (roomId, studentId) => {
    try {
      setLoading(true);
      
      // First check if the room and student exist
      const room = rooms.find(r => r.id === roomId);
      if (!room) {
        message.error('Room not found');
        setLoading(false);
        return;
      }
      
      // Check if student is actually in this room
      const studentInRoom = room.occupants && room.occupants.some(s => s.id === studentId);
      if (!studentInRoom) {
        message.warning('Student is not assigned to this room');
        setLoading(false);
        return;
      }
      
      await hostelService.removeStudentFromRoom(roomId, studentId);
      
      message.success('Student removed from room successfully');
      
      // Refresh data
      loadRooms(selectedHostel);
      loadStudents();
    } catch (error) {
      console.error('Error removing student:', error);
      message.error('Failed to remove student: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };
  
  // Table columns
  const hostelColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Capacity',
      dataIndex: 'capacity',
      key: 'capacity',
      render: (_, record) => {
        const hostelRooms = rooms.filter(room => room.hostelId === record.id);
        const totalCapacity = hostelRooms.reduce((sum, room) => {
          const capacity = room.capacity ? parseInt(room.capacity, 10) : 0;
          return sum + capacity;
        }, 0);
        return totalCapacity;
      },
    },
    {
      title: 'Occupancy',
      dataIndex: 'occupancy',
      key: 'occupancy',
      render: (_, record) => {
        const hostelRooms = rooms.filter(room => room.hostelId === record.id);
        const occupiedCount = hostelRooms.reduce((sum, room) => sum + (room.occupants?.length || 0), 0);
        return occupiedCount;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => showEditHostelModal(record)}
          />
          <Popconfirm
            title="Are you sure you want to delete this hostel?"
            onConfirm={() => handleDeleteHostel(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];
  
  const roomColumns = [
    {
      title: 'Room Number',
      dataIndex: 'roomNumber',
      key: 'roomNumber',
    },
    {
      title: 'Floor',
      dataIndex: 'floor',
      key: 'floor',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => type.charAt(0).toUpperCase() + type.slice(1),
    },
    {
      title: 'Capacity',
      dataIndex: 'capacity',
      key: 'capacity',
    },
    {
      title: 'Occupancy',
      dataIndex: 'occupants',
      key: 'occupancy',
      render: (occupants, record) => `${occupants?.length || 0}/${record.capacity}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (_, record) => {
        const occupiedCount = record.occupants?.length || 0;
        if (occupiedCount === 0) {
          return <Tag color="green">Available</Tag>;
        } else if (occupiedCount < record.capacity) {
          return <Tag color="blue">Partially Occupied</Tag>;
        } else {
          return <Tag color="red">Full</Tag>;
        }
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => showEditRoomModal(record)}
          />
          <Button 
            icon={<UserAddOutlined />} 
            onClick={() => showAssignModal(record)}
            disabled={record.occupants?.length >= record.capacity}
          />
          <Popconfirm
            title="Are you sure you want to delete this room?"
            onConfirm={() => handleDeleteRoom(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];
  
  const expandedRowRender = (record) => {
    const occupants = record.occupants || [];
    
    const studentColumns = [
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: 'Student ID',
        dataIndex: 'studentId',
        key: 'studentId',
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (_, student) => (
          <Popconfirm
            title="Are you sure you want to remove this student from the room?"
            onConfirm={() => handleRemoveStudent(record.id, student.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<UserDeleteOutlined />} />
          </Popconfirm>
        ),
      },
    ];
    
    return (
      <div style={{ margin: '0 16px' }}>
        <Text strong>Assigned Students:</Text>
        {occupants.length > 0 ? (
          <Table 
            columns={studentColumns} 
            dataSource={occupants.map(student => ({ ...student, key: student.id }))} 
            pagination={false} 
            size="small" 
            style={{ marginTop: 8 }}
          />
        ) : (
          <Empty description="No students assigned to this room" />
        )}
      </div>
    );
  };
  
  return (
    <div className="hostel-assignment-container">
      <Tabs defaultActiveKey="hostels">
        <TabPane tab="Hostels" key="hostels">
          <div style={{ marginBottom: 16 }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={showAddHostelModal}
            >
              Add Hostel
            </Button>
          </div>
          
          <Table 
            columns={hostelColumns} 
            dataSource={hostels.map(hostel => ({ ...hostel, key: hostel.id }))} 
            rowKey="id"
            loading={loading}
          />
        </TabPane>
        
        <TabPane tab="Rooms" key="rooms">
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Select
                placeholder="Select Hostel"
                style={{ width: 200 }}
                value={selectedHostel}
                onChange={setSelectedHostel}
              >
                {hostels.map(hostel => (
                  <Option key={hostel.id} value={hostel.id}>{hostel.name}</Option>
                ))}
              </Select>
              
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={showAddRoomModal}
                disabled={!selectedHostel}
              >
                Add Room
              </Button>
            </Space>
          </div>
          
          <Table 
            columns={roomColumns} 
            dataSource={rooms.map(room => ({ ...room, key: room.id }))} 
            rowKey="id"
            expandable={{ expandedRowRender }}
            loading={loading}
          />
        </TabPane>
        
        <TabPane tab="Students" key="students">
          <Card title="Students">
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Input
                  placeholder="Search students"
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  allowClear
                />
              </Col>
              <Col span={12} style={{ textAlign: 'right' }}>
                <Button
                  icon={<ScanOutlined />}
                  onClick={scanning ? stopScan : startScan}
                  loading={scanning}
                >
                  {scanning ? 'Stop Scan' : 'Scan NFC'}
                </Button>
              </Col>
            </Row>
            
            <Table
              dataSource={filteredStudents}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              columns={[
                {
                  title: 'Name',
                  dataIndex: 'name',
                  key: 'name',
                },
                {
                  title: 'Student ID',
                  dataIndex: 'studentId',
                  key: 'studentId',
                },
                {
                  title: 'Hostel Assignment',
                  key: 'hostelAssignment',
                  render: (_, record) => (
                    record.hostelAssignment ? (
                      <Tag color="blue">
                        {`${record.hostelAssignment.hostelName || 'Hostel'} - Room ${record.hostelAssignment.roomNumber}`}
                      </Tag>
                    ) : (
                      <Tag color="red">Not Assigned</Tag>
                    )
                  )
                }
              ]}
            />
          </Card>
        </TabPane>
      </Tabs>
      
      {/* Hostel Form Modal */}
      <Modal
        title={editingHostel ? 'Edit Hostel' : 'Add Hostel'}
        visible={isHostelModalVisible}
        onCancel={() => setIsHostelModalVisible(false)}
        footer={null}
      >
        <Form
          form={hostelForm}
          layout="vertical"
          onFinish={handleHostelFormSubmit}
        >
          <Form.Item
            name="name"
            label="Hostel Name"
            rules={[{ required: true, message: 'Please enter hostel name' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          
          <Form.Item
            name="gender"
            label="Gender"
            rules={[{ required: true, message: 'Please select gender' }]}
          >
            <Select>
              <Option value="male">Male</Option>
              <Option value="female">Female</Option>
              <Option value="mixed">Mixed</Option>
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              {editingHostel ? 'Update' : 'Add'}
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={() => setIsHostelModalVisible(false)}>
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Room Form Modal */}
      <Modal
        title={editingRoom ? 'Edit Room' : 'Add Room'}
        visible={isRoomModalVisible}
        onCancel={() => setIsRoomModalVisible(false)}
        footer={null}
      >
        <Form
          form={roomForm}
          layout="vertical"
          onFinish={handleRoomFormSubmit}
        >
          <Form.Item
            name="hostelId"
            label="Hostel"
            rules={[{ required: true, message: 'Please select hostel' }]}
          >
            <Select disabled={!!editingRoom}>
              {hostels.map(hostel => (
                <Option key={hostel.id} value={hostel.id}>{hostel.name}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="roomNumber"
            label="Room Number"
            rules={[{ required: true, message: 'Please enter room number' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="floor"
            label="Floor"
            rules={[{ required: true, message: 'Please enter floor' }]}
          >
            <Input type="number" />
          </Form.Item>
          
          <Form.Item
            name="capacity"
            label="Capacity"
            rules={[{ required: true, message: 'Please enter capacity' }]}
          >
            <Input type="number" min={1} max={10} />
          </Form.Item>
          
          <Form.Item
            name="type"
            label="Room Type"
            rules={[{ required: true, message: 'Please select room type' }]}
          >
            <Select>
              <Option value="standard">Standard</Option>
              <Option value="deluxe">Deluxe</Option>
              <Option value="suite">Suite</Option>
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              {editingRoom ? 'Update' : 'Add'}
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={() => setIsRoomModalVisible(false)}>
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Assign Student Modal */}
      <Modal
        title={`Assign Student to Room ${selectedRoom?.roomNumber}`}
        visible={isAssignModalVisible}
        onCancel={() => setIsAssignModalVisible(false)}
        footer={null}
      >
        <Form
          form={assignForm}
          layout="vertical"
          onFinish={handleAssignStudent}
        >
          <Form.Item
            name="studentId"
            label="Student"
            rules={[{ required: true, message: 'Please select a student' }]}
          >
            <Select
              showSearch
              placeholder="Select a student"
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {students
                .filter(s => !s.hostelAssignment) // Only show unassigned students
                .map(student => (
                  <Option key={student.id} value={student.id}>
                    {student.name} {student.studentId ? `(${student.studentId})` : ''}
                  </Option>
                ))
              }
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Assign
              </Button>
              <Button onClick={() => setIsAssignModalVisible(false)}>
                Cancel
              </Button>
              <Button 
                icon={<ScanOutlined />}
                onClick={scanning ? stopScan : startScan}
                loading={scanning}
              >
                Scan NFC
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default HostelAssignment;