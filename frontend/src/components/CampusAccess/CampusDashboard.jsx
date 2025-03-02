import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  List,
  Typography,
  Spin,
  Empty,
  DatePicker,
  Tag,
} from "antd";
import {
  UserOutlined,
  LoginOutlined,
  LogoutOutlined,
  HistoryOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { campusAccessService } from "../../utils/firebase/campusAccessService";
import moment from "moment";

const { Text, Title } = Typography;

function CampusDashboard() {
  const [loading, setLoading] = useState(true);
  const [allEvents, setAllEvents] = useState([]);
  const [stats, setStats] = useState({
    totalAccess: 0,
    uniqueStudents: 0,
    entriesCount: 0,
    exitsCount: 0,
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  const disabledDate = (current) => {
    // Can't select days after today
    return current && current > moment().endOf("day");
  };

  const handleDateChange = (date) => {
    // Ensure we don't accept future dates
    if (date && date.isAfter(moment())) {
      message.warning('Cannot select future dates');
      return;
    }


    setSelectedDate(date ? date.toDate() : null);

    // No need to re-subscribe, just filter the existing data
 // No need to re-subscribe, just filter the existing data
 if (allEvents.length > 0) {
  const filteredEvents = filterEventsByDate(allEvents, date ? date.toDate() : null);
  processDashboardData(filteredEvents);
  
  // Also filter recent events
  if (date) {
    const filteredRecentEvents = filterEventsByDate(recentEvents, date.toDate());
    setRecentEvents(filteredRecentEvents);
  } else {
    // Reset to the original recent events by filtering the allEvents
    const latestEvents = allEvents
      .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10);
        setRecentEvents(latestEvents);
      }
    }
  };
  useEffect(() => {
    // Set up real-time listener for all access events
    const unsubscribe = campusAccessService.subscribeToAllAccessEvents(
      (events) => {
        setAllEvents(events);
        // Process data based on current filter
        const filteredEvents = filterEventsByDate(events, selectedDate);
        processDashboardData(filteredEvents);
      }
    );

    // Set up real-time listener for recent events (always show most recent regardless of date filter)
    const unsubscribeRecent = campusAccessService.subscribeToRecentAccessEvents(
      10,
      (events) => {
        // Only filter recent events if a date is selected
        if (selectedDate) {
          const filteredRecentEvents = filterEventsByDate(events, selectedDate);
          setRecentEvents(filteredRecentEvents);
        } else {
          setRecentEvents(events);
        }
      }
    );

    return () => {
      unsubscribe();
      unsubscribeRecent();
    };
  }, [selectedDate]); // Re-run when selectedDate changes

  // Helper function to filter events by date
  const filterEventsByDate = (events, date) => {
    if (!date) return events;

    // Create start and end of the selected day in local timezone
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return events.filter((event) => {
      if (!event.timestamp) return false;

      // Convert to date object if it's not already
      const eventTime =
        event.timestamp instanceof Date
          ? event.timestamp
          : new Date(event.timestamp);

      return eventTime >= startOfDay && eventTime <= endOfDay;
    });
  };

  const processDashboardData = (filteredEvents) => {
    try {
      // Get unique students
      const uniqueStudents = new Set(
        filteredEvents
          .filter((event) => event.studentId)
          .map((event) => event.studentId)
      );

      // Count entries and exits
      const entriesCount = filteredEvents.filter(
        (event) => event.eventType === "entry"
      ).length;
      const exitsCount = filteredEvents.filter(
        (event) => event.eventType === "exit"
      ).length;

      setStats({
        totalAccess: filteredEvents.length,
        uniqueStudents: uniqueStudents.size,
        entriesCount,
        exitsCount,
      });

      setLoading(false);
    } catch (error) {
      console.error("Error processing dashboard data:", error);
      setLoading(false);
    }
  };

  // Format the selected date for display
  const formattedSelectedDate = selectedDate
    ? new Date(selectedDate).toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "All Time";

  return (
    <div className="campus-dashboard-container">
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card>
            <Row gutter={16} align="middle">
              <Col>
                <Title level={4} style={{ margin: 0 }}>
                  Campus Access Dashboard
                </Title>
              </Col>
              <Col flex="auto">
                <div style={{ display: "flex", alignItems: "center" }}>
                  <CalendarOutlined style={{ marginRight: 8 }} />
                  <Text strong>{formattedSelectedDate}</Text>
                </div>
              </Col>
              <Col>
                <DatePicker
                  onChange={handleDateChange}
                  placeholder="Filter by date"
                  value={selectedDate ? moment(selectedDate) : null}
                  disabledDate={disabledDate}
                  showToday
                  format="MMMM D, YYYY"
                  allowClear
                  inputReadOnly={true} // Prevents manual input that could cause issues
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {loading ? (
        <div style={{ textAlign: "center", padding: "50px 0" }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Unique Students"
                  value={stats.uniqueStudents}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Access Events"
                  value={stats.totalAccess}
                  prefix={<HistoryOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Entries"
                  value={stats.entriesCount}
                  prefix={<LoginOutlined style={{ color: "#52c41a" }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Exits"
                  value={stats.exitsCount}
                  prefix={<LogoutOutlined style={{ color: "#1890ff" }} />}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col span={24}>
              <Card
                title={
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>Recent Access Events</span>
                    {selectedDate && (
                      <Tag color="blue">
                        Filtered: {new Date(selectedDate).toLocaleDateString()}
                      </Tag>
                    )}
                  </div>
                }
              >
                {recentEvents.length > 0 ? (
                  <List
                    dataSource={recentEvents}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          title={`${item.studentName || "Unknown"} (ID: ${
                            item.studentId || "N/A"
                          })`}
                          description={
                            <>
                              <Text
                                type={
                                  item.eventType === "entry"
                                    ? "success"
                                    : "danger"
                                }
                              >
                                {item.eventType === "entry" ? "Entry" : "Exit"}
                              </Text>
                              <Text> - {item.timestamp?.toLocaleString()}</Text>
                              {item.reason && (
                                <div>
                                  <Text type="secondary">
                                    Reason: {item.reason}
                                  </Text>
                                </div>
                              )}
                            </>
                          }
                        />
                        <div>
                          <Tag
                            color={
                              item.accessType === "granted" ? "green" : "red"
                            }
                          >
                            {item.accessType === "granted"
                              ? "Granted"
                              : "Denied"}
                          </Tag>
                        </div>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty
                    description={
                      selectedDate
                        ? `No access events recorded on ${new Date(
                            selectedDate
                          ).toLocaleDateString()}`
                        : "No recent access events"
                    }
                  />
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}

export default CampusDashboard;
