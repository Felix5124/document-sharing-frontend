import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { sendChatbotQuery } from '../services/api';
import { Link } from 'react-router-dom';
import '../styles/Chatbot.css';
import ReactMarkdown from 'react-markdown';

const Chatbot = () => {
  const { user, isLoading: isAuthLoading } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [showQuickReplies, setShowQuickReplies] = useState(true); // Mặc định là true khi có user

  const baseQuickReplyOptions = [
    { label: "Xem điểm của tôi", query: "Xem điểm của tôi" },
    { label: "Số tài liệu tải lên của tôi?", query: "Số tài liệu tải lên của tôi" },
    { label: "Số tài liệu tải về của tôi?", query: "Số tài liệu tải về của tôi" },
    { label: "Hướng dẫn tải tài liệu lên", query: "Hướng dẫn tải tài liệu lên" },
    { label: "Hướng dẫn tải tài liệu xuống", query: "Hướng dẫn tải tài liệu xuống" },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (isOpen && !isAuthLoading) {
      const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
      if (!user && lastMessage && lastMessage.sender !== 'bot-login-prompt') {
        setMessages(prev => [
          ...prev.filter(m => m && m.sender === 'user' && prev.indexOf(m) === prev.length - 2), // Giữ lại tin nhắn cuối của user nếu có
          {
            sender: 'bot',
            text: (<span>Phiên của bạn đã kết thúc. Vui lòng <Link to="/login" onClick={() => {setIsOpen(false); setShowQuickReplies(false);}}>đăng nhập</Link> lại.</span>),
            type: 'bot-login-prompt'
          }
        ]);
        setShowQuickReplies(false); // Không hiển thị quick replies nếu chưa đăng nhập
      } else if (user && messages.length === 1 && lastMessage && lastMessage.type === 'bot-login-prompt') {
        // User vừa đăng nhập và trước đó là thông báo yêu cầu đăng nhập
        setMessages([{ sender: 'bot', text: `Xin chào ${user.fullName || 'bạn'}! Tôi có thể giúp gì?` }]);
        setShowQuickReplies(true); // Hiển thị quick replies khi chào mừng user
      }
    }
  }, [isOpen, user, isAuthLoading, messages]);

  const toggleChatbot = () => {
    const newIsOpenState = !isOpen;
    setIsOpen(newIsOpenState);

    if (newIsOpenState) { // Khi mở chatbot
      if (!isAuthLoading && user) {
        setShowQuickReplies(true); // Nếu đã đăng nhập, hiển thị quick replies
      } else if (!isAuthLoading && !user) {
        setShowQuickReplies(false); // Nếu chưa đăng nhập, ẩn
      }
      // Logic khởi tạo tin nhắn ban đầu
      if (messages.length === 0) {
        if (isAuthLoading) {
          setMessages([{ sender: 'bot', text: 'Đang kiểm tra trạng thái đăng nhập...' }]);
          setShowQuickReplies(false);
        } else if (!user) {
          setMessages([{
            sender: 'bot',
            text: (<span>Xin chào! Vui lòng <Link to="/login" onClick={() => { setIsOpen(false); setShowQuickReplies(false); }}>đăng nhập</Link> để sử dụng chatbot.</span>),
            type: 'bot-login-prompt'
          }]);
          setShowQuickReplies(false);
        } else {
          setMessages([{ 
            sender: 'bot', 
            text: `Xin chào ${user.fullName || 'bạn'}! Bạn muốn thực hiện thao tác nào?` 
          }]);
          setShowQuickReplies(true); // Hiển thị quick replies khi chào mừng user
        }
      }
    } else { // Khi đóng chatbot
        setShowQuickReplies(false); // Luôn ẩn quick replies khi đóng chatbot
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    // Tạm thời ẩn quick replies khi người dùng bắt đầu gõ
    if (e.target.value.trim() !== '' && showQuickReplies) {
      setShowQuickReplies(false);
    }
    // Nếu người dùng xóa hết chữ và trước đó quick replies đang ẩn do gõ chữ,
    // thì không tự động hiện lại ở đây, chờ bot trả lời hoặc toggle thủ công.
  };
  
  const handleToggleQuickReplies = () => {
    setShowQuickReplies(prevState => !prevState);
  };

  const processAndSendMessage = async (messageText) => {
    if (!messageText.trim()) return;
    
    // Tạm thời ẩn Quick Replies khi người dùng gửi tin nhắn
    // Điều này đảm bảo nó ẩn đi ngay cả khi người dùng click vào một quick reply item.
    if (showQuickReplies) {
        setShowQuickReplies(false);
    }

    const userDisplayMessage = { sender: 'user', text: messageText };
    setMessages((prevMessages) => [...prevMessages, userDisplayMessage]);
    setIsChatLoading(true); // Bot bắt đầu "typing"

    if (isAuthLoading) {
      setMessages((prev) => [...prev, { sender: 'bot', text: 'Vui lòng đợi kiểm tra đăng nhập xong...' }]);
      setIsChatLoading(false);
      // Không hiển thị lại quick replies ở đây vì user chưa tương tác được
      return;
    }
    if (!user) {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          sender: 'bot',
          text: (<span>Bạn cần <Link to="/login" onClick={() => { setIsOpen(false); setShowQuickReplies(false);}}>đăng nhập</Link> để tôi có thể hỗ trợ bạn.</span>),
          type: 'bot-login-prompt'
        },
      ]);
      setIsChatLoading(false);
      setShowQuickReplies(false); // Đảm bảo quick replies ẩn nếu không có user
      return;
    }

    try {
      const response = await sendChatbotQuery({ message: messageText, userId: user.userId });
      const newBotMessage = { sender: 'bot', text: response.data.reply };
      setMessages((prevMessages) => [...prevMessages, newBotMessage]);
    } catch (error) {
      const errorText = error.response?.data?.message || error.message || 'Lỗi không xác định.';
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: 'bot', text: `Xin lỗi, đã có lỗi: ${errorText}. Vui lòng thử lại.` },
      ]);
    } finally {
      setIsChatLoading(false); // Bot đã trả lời xong
      // Hiển thị lại Quick Replies sau khi bot trả lời, nếu user vẫn còn đăng nhập
      if (user) { // Kiểm tra lại user vì session có thể hết hạn trong lúc chờ API
          setShowQuickReplies(true);
      }
    }
  };

  const handleTextInputSubmit = async (e) => {
    e.preventDefault();
    processAndSendMessage(inputValue);
    setInputValue('');
  };

  const handleQuickReplyClick = (query) => {
    // processAndSendMessage sẽ ẩn quick replies tạm thời và sau đó hiện lại
    processAndSendMessage(query); 
    setInputValue(''); // Xóa input nếu người dùng click quick reply
  };

  // --- PHẦN JSX KHÔNG THAY ĐỔI NHIỀU ---
  // Chỉ cần đảm bảo điều kiện render của quick replies là đúng
  // {user && !isChatLoading && showQuickReplies && (...)}
  // Nút toggle quick replies cũng nên kiểm tra !isChatLoading

  if (!isOpen) {
    return (
      <button
        className="chatbot-toggle-button btn btn-primary rounded-circle shadow"
        style={{
          width: '50px',
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={toggleChatbot}
        title="Mở Chatbot"
      >
        <i className="bi bi-chat-dots-fill" style={{ fontSize: '1.5rem' }}></i>
      </button>
    );
  }

  return (
    <div className="chatbot-container shadow">
      <div className="chatbot-header">
        <h5>Agent AI ProVip :))</h5>
        <button onClick={toggleChatbot} className="btn-close" aria-label="Đóng Chatbot"></button>
      </div>
      <div className="chatbot-messages">
        {messages.map((msg, index) => {
          if (!msg) {
            return null; 
          }
          return (
            <div key={index} className={`message ${msg.sender || 'unknown'}`}>
              {msg.sender === 'bot' && <i className="bi bi-robot me-2"></i>}
              <div className="message-text">
                {typeof msg.text === 'string' ? (
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                ) : React.isValidElement(msg.text) ? (
                  msg.text
                ) : (
                  JSON.stringify(msg.text)
                )}
              </div>
              {msg.sender === 'user' && <i className="bi bi-person-fill ms-2"></i>}
            </div>
          );
        })}
        {isChatLoading && (
          <div className="message bot">
            <i className="bi bi-robot me-2"></i>
            <div className="message-text typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Quick Replies Section */}
      {user && !isChatLoading && showQuickReplies && ( // Hiển thị khi user đăng nhập, bot không load, và state cho phép
        <div className="chatbot-quick-replies">
          {baseQuickReplyOptions.map((option) => (
            <button
              key={option.query}
              className="quick-reply-button"
              onClick={() => handleQuickReplyClick(option.query)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleTextInputSubmit} className="chatbot-input-form">
        {/* Nút bật/tắt quick replies thủ công */}
        {user && !isChatLoading && ( // Chỉ hiện khi user đăng nhập và bot không load
            <button
              type="button"
              onClick={handleToggleQuickReplies}
              className="quick-reply-visibility-toggle btn btn-sm btn-outline-secondary me-2"
              title={showQuickReplies ? "Ẩn gợi ý nhanh" : "Hiện gợi ý nhanh"}
              style={{ lineHeight: 1, padding: '0.25rem 0.5rem' }}
            >
              {showQuickReplies ? <i className="bi bi-chevron-bar-up"></i> : <i className="bi bi-chevron-bar-down"></i>}
            </button>
        )}
        <input
          type="text"
          className="form-control"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={isAuthLoading ? "Đang kiểm tra..." : (user ? "Nhập tin nhắn..." : "Vui lòng đăng nhập")}
          disabled={isAuthLoading || !user || isChatLoading}
        />
        <button
          type="submit"
          className="btn btn-primary ms-2"
          disabled={isAuthLoading || !user || isChatLoading || !inputValue.trim()}
          aria-label="Gửi tin nhắn"
        >
          <i className="bi bi-send-fill"></i>
        </button>
      </form>
    </div>
  );
};

export default Chatbot;