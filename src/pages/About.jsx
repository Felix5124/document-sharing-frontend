import React, { use } from 'react';
import '../styles/pages/About.css';
import placeholderAvatar from '../assets/images/default-avatar.png';
import img from '../assets/images/ph.jpg'
const About = () => {
    // Replace the members array with your real member names and image files.
    // Put member images in src/assets/images and update the `image` path.
    const members = [
        { name: 'Nguyễn Đăng Khoa', role: 'Backend / Database', image: placeholderAvatar,username: 'khoa-nd' },
        { name: 'Trần Đình Phi Hùng', role: 'Frontend / UI', image: img, username: 'PhiHung' },
        { name: 'Bùi Thành Đạt', role: 'Fullstack Developer', image: placeholderAvatar, username: 'dat-bt' }
    ];

    return (
        <div className="about-page container">
            <h1>Giới thiệu dự án</h1>

            <section className="about-section detail">
                <h2>Ý tưởng đề tài</h2>
                <p>
                    Xây dựng một nền tảng chia sẻ tài liệu học thuật/giáo trình cho sinh viên và giảng viên, cho phép
                    người dùng tải lên, duyệt, báo cáo và tải xuống tài liệu. Hệ thống hỗ trợ phân quyền, kiểm duyệt tự động
                    và thủ công, tích hợp xác thực qua Firebase, gửi email giao dịch bằng SendGrid và lưu trữ file trên Azure Blob.
                </p>
            </section>

            <section className="about-section detail">
                <h2>Lý do chọn đề tài</h2>
                <p>Tăng cường khả năng chia sẻ tài nguyên học tập giữa sinh viên.</p>
                <p>Giải quyết vấn đề phân loại và kiểm duyệt tài pệu với workflow kết hợp tự động và admin.</p>
                <p>Học và áp dụng các kỹ thuật: authentication, cloud storage, transactional email, và CI/CD.</p>
                <p>Triển khai mô hình thực tế cho quy trình duyệt nội dung do cộng đồng đóng góp.</p>

            </section>

            <section className="about-section">
                <h2>Thông tin thành viên</h2>
                <div className="members-grid">
                    {members.map((m, idx) => (
                        <div className="member-card" key={idx}>
                            <img src={m.image} alt={m.name} className="member-avatar" />
                            <div className="member-info">
                                <strong className="member-name">{m.name}</strong>
                                <div className="member-role">{m.role}</div>
                                <div className="member-placeholder">Username: <em>{m.username}</em></div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default About;
