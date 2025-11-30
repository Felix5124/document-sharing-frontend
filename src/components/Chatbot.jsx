import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { sendChatbotQuery } from '../services/api';
import { Link } from 'react-router-dom';
import '../styles/Chatbot.css';
import ReactMarkdown from 'react-markdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'; // Thêm icon mũi tên
const Chatbot = () => {
  const { user, isLoading: isAuthLoading, logout } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [showQuickReplies, setShowQuickReplies] = useState(true); // Mặc định là true khi có user
  
  // 2. Thêm Ref cho thanh cuộn Quick Replies
  const scrollRef = useRef(null);

  const baseQuickReplyOptions = [
    { label: "Xem lượt tải của tôi", query: "Tôi còn bao nhiêu lượt tải hôm nay?" },
    { label: "Top tài liệu của tôi", query: "Tài liệu nào của tôi được tải nhiều nhất?" },
    { label: "Hướng dẫn đăng tài liệu", query: "Hướng dẫn tôi cách tải tài liệu lên hệ thống." },
    { label: "Quyền lợi VIP", query: "Tài khoản VIP có những quyền lợi gì?" },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // 3. Thêm hàm xử lý cuộn trái/phải
  const scroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = 200; // Khoảng cách mỗi lần bấm
      if (direction === 'left') {
        current.scrollLeft -= scrollAmount;
      } else {
        current.scrollLeft += scrollAmount;
      }
    }
  };

  // 4. Cập nhật useEffect scrollToBottom để chạy khi showQuickReplies thay đổi
  // Giúp tránh việc bị lệch khi thanh gợi ý hiện lại
  useEffect(() => {
    scrollToBottom();
  }, [messages, showQuickReplies, isChatLoading]);

  useEffect(() => {
    if (isOpen && !isAuthLoading) {
      const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
      if (!user && lastMessage && lastMessage.sender !== 'bot-login-prompt') {
        setMessages(prev => [
          ...prev.filter(m => m && m.sender === 'user' && prev.indexOf(m) === prev.length - 2), // Giữ lại tin nhắn cuối của user nếu có
          {
            sender: 'bot',
            text: (<span>Phiên của bạn đã kết thúc. Vui lòng <Link to="/login" onClick={() => { setIsOpen(false); setShowQuickReplies(false); }}>đăng nhập</Link> lại.</span>),
            type: 'bot-login-prompt'
          }
        ]);
        setShowQuickReplies(false); // Không hiển thị quick replies nếu chưa đăng nhập
      } else if (user && messages.length === 1 && lastMessage && lastMessage.type === 'bot-login-prompt') {
        // User vừa đăng nhập và trước đó là thông báo yêu cầu đăng nhập
        setMessages([{ sender: 'bot', text: `Xin chào ${user.fullName || 'bạn'}! Tôi là **DocShare AI Assistant**, trợ lý ảo chuyên trách hỗ trợ bạn quản lý tài liệu và tài khoản tại hệ thống. Tôi có thể giúp bạn kiểm tra lượt tải, thống kê tài liệu hoặc hướng dẫn sử dụng. Bạn cần hỗ trợ gì hôm nay?` }]);
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
            text: `Xin chào ${user.fullName || 'bạn'}! Tôi là **DocShare AI Assistant**, trợ lý ảo chuyên trách hỗ trợ bạn quản lý tài liệu và tài khoản tại hệ thống. Tôi có thể giúp bạn kiểm tra lượt tải, thống kê tài liệu hoặc hướng dẫn sử dụng. Bạn cần hỗ trợ gì hôm nay?`
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
          text: (<span>Bạn cần <Link to="/login" onClick={() => { setIsOpen(false); setShowQuickReplies(false); }}>đăng nhập</Link> để tôi có thể hỗ trợ bạn.</span>),
          type: 'bot-login-prompt'
        },
      ]);
      setIsChatLoading(false);
      setShowQuickReplies(false); // Đảm bảo quick replies ẩn nếu không có user
      return;
    }

    try {
      // Chuẩn bị lịch sử chat để gửi lên backend
      const historyToSend = messages.map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          text: typeof m.text === 'string' ? m.text : '' // Chỉ gửi text, không gửi JSX
      })).filter(m => m.text !== ''); // Lọc tin nhắn rỗng hoặc lỗi

      const response = await sendChatbotQuery({
          message: messageText,
          userId: user.userId,
          history: historyToSend // Gửi kèm lịch sử
      });
      const newBotMessage = { sender: 'bot', text: response.data.reply };
      setMessages((prevMessages) => [...prevMessages, newBotMessage]);
    } catch (error) {
      // --- BẮT ĐẦU THAY ĐỔI ---
      
      // Kiểm tra lỗi 401 (Unauthorized)
      if (error.response && error.response.status === 401) {
          const sessionExpiredMsg = {
              sender: 'bot',
              // Sử dụng type 'error' để style màu đỏ (như CSS ở trên)
              type: 'error',
              text: (
                  <span>
                      ⚠️ <strong>Kết nối bị ngắt!</strong><br />
                      Phiên đăng nhập của bạn đã hết hạn. Vui lòng <Link to="/login" onClick={() => { setIsOpen(false); setShowQuickReplies(false); }}>đăng nhập lại</Link> để tiếp tục.
                  </span>
              )
          };
          
          setMessages((prevMessages) => [...prevMessages, sessionExpiredMsg]);
          setShowQuickReplies(false); // Ẩn gợi ý
          // logout(); // Tùy chọn: Gọi logout để clear state global
      } else {
          // Xử lý các lỗi khác như cũ
          const errorText = error.response?.data?.message || error.message || 'Lỗi không xác định.';
          setMessages((prevMessages) => [
              ...prevMessages,
              { sender: 'bot', text: `Xin lỗi, đã có lỗi: ${errorText}. Vui lòng thử lại.` },
          ]);
      }
      // --- KẾT THÚC THAY ĐỔI ---
    } finally {
      setIsChatLoading(false);
      // Chỉ hiện lại Quick Replies nếu KHÔNG phải lỗi 401
      if (user && !(error?.response?.status === 401)) {
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
        className="chatbot-toggle-button"
        onClick={toggleChatbot}
        title="Mở Chatbot"
      >
        <FontAwesomeIcon icon={faComment} />
      </button>
    );
  }

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h5>Agent AI</h5>
        <button onClick={toggleChatbot} className="chatbot-close-btn" aria-label="Đóng Chatbot">
          ✖
        </button>
      </div>

      <div className="chatbot-messages">
        {messages.map((msg, index) => {
          if (!msg) return null;

          return (
            <div key={index} className={`message ${msg.sender || 'unknown'} ${msg.type === 'error' ? 'error' : ''}`}>
              {msg.sender === 'bot' && <span className="icon">🤖</span>}
              <div className="message-text">
                {typeof msg.text === 'string' ? (
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                ) : React.isValidElement(msg.text) ? (
                  msg.text
                ) : (
                  JSON.stringify(msg.text)
                )}
              </div>
              {msg.sender === 'user' && <span className="icon">👤</span>}
            </div>
          );
        })}

        {isChatLoading && (
          <div className="message bot">
            <span className="icon">🤖</span>
            <div className="message-text typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 5. Cấu trúc lại phần Quick Replies để thêm nút bấm */}
      {user && !isChatLoading && showQuickReplies && (
        <div className="chatbot-quick-replies-wrapper">
          {/* Nút cuộn trái */}
          <button
            className="scroll-btn left"
            onClick={(e) => { e.preventDefault(); scroll('left'); }}
            type="button"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>

          <div className="chatbot-quick-replies" ref={scrollRef}>
            {baseQuickReplyOptions.map((option) => (
              <button
                key={option.query}
                className="quick-reply-button"
                onClick={() => handleQuickReplyClick(option.query)}
                type="button" // Quan trọng để không kích hoạt submit form
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Nút cuộn phải */}
          <button
            className="scroll-btn right"
            onClick={(e) => { e.preventDefault(); scroll('right'); }}
            type="button"
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      )}

      <form onSubmit={handleTextInputSubmit} className="chatbot-input-form">
        {user && !isChatLoading && (
          <button
            type="button"
            onClick={handleToggleQuickReplies}
            className="quick-reply-visibility-toggle"
            title={showQuickReplies ? "Ẩn gợi ý nhanh" : "Hiện gợi ý nhanh"}
          >
            {showQuickReplies ? '⬆️' : '⬇️'}
          </button>
        )}
        <input
          type="text"
          className="chatbot-input"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={
            isAuthLoading ? "Đang kiểm tra..." : user ? "Nhập tin nhắn..." : "Vui lòng đăng nhập"
          }
          disabled={isAuthLoading || !user || isChatLoading}
        />
        <button
          type="submit"
          className="chatbot-send-button"
          disabled={isAuthLoading || !user || isChatLoading || !inputValue.trim()}
          aria-label="Gửi tin nhắn"
        >
          📤
        </button>
      </form>
    </div>

  );
};

export default Chatbot;