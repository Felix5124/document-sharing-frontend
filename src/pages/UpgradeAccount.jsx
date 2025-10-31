import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { subscribeVip } from "../services/api";
import { toast } from "react-toastify";

function UpgradeAccount() {
  const { user } = useContext(AuthContext);

  const handleUpgrade = async () => {
    if (!user) {
      toast.error("Bạn cần đăng nhập trước khi nâng cấp!");
      return;
    }

    try {
      const data = {
        userId: user.userId || user.id, // tuỳ backend của m
        subscriptionType: "Monthly",
        price: 0,
        paymentMethod: "Test",
        transactionId: "FAKE_" + Date.now(),
      };

      const res = await subscribeVip(data);
      toast.success("Tài khoản đã được nâng cấp lên VIP!");
      console.log("VIP Subscription:", res.data);
    } catch (error) {
      console.error("Lỗi khi nâng cấp VIP:", error);
      toast.error("Có lỗi xảy ra khi nâng cấp tài khoản.");
    }
  };

  return (
    <div className="all-container">
      <div className="all-container-card">
        <div className="upload-title">
          <h4>Nâng cấp tài khoản</h4>
        </div>

        <div className="upgrade-content">
          <p>Tài khoản thường của bạn có thể nâng cấp lên VIP để tải nhiều tài liệu hơn.</p>
          <button className="vip-upgrade-btn" onClick={handleUpgrade}>
            Nâng cấp VIP (Test)
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpgradeAccount;
