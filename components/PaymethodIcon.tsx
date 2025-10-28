"use client";

interface paymethodProps {
  method: string;
}

const PaymethodIcon: React.FC<paymethodProps> = ({ method }) => {
  const getMethodInfo = () => {
    switch (method) {
      case "微信":
        return {
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              height="20"
              width="20"
              className="text-green-600"
            >
              <desc>Wechat Pay Logo Streamline Icon</desc>
              <g>
                <path
                  d="M22.74 6.58a0.5 0.5 0 0 0 -0.67 -0.09L8.89 15.65a0.69 0.69 0 0 1 -1 -0.23L4.41 9.37a0.7 0.7 0 0 1 0.11 -0.84 0.67 0.67 0 0 1 0.83 -0.12l3.85 2.14a0.51 0.51 0 0 0 0.48 0l10.77 -5.74a0.49 0.49 0 0 0 0.26 -0.39 0.48 0.48 0 0 0 -0.17 -0.42A13.07 13.07 0 0 0 12 1C5.38 1 0 5.5 0 11a9.2 9.2 0 0 0 3.44 7 0.24 0.24 0 0 1 0.09 0.22l-0.43 3.95a0.76 0.76 0 0 0 0.36 0.73 0.76 0.76 0 0 0 0.39 0.1 0.72 0.72 0 0 0 0.42 -0.13c0.11 -0.08 2.58 -1.76 3.43 -2.38a0.24 0.24 0 0 1 0.2 0 22.28 22.28 0 0 0 4.1 0.63c6.62 0 12 -4.5 12 -10a8.75 8.75 0 0 0 -1.26 -4.54Z"
                  fill="currentColor"
                  strokeWidth="1"
                />
                <path d="M8.34 19.82Z" fill="currentColor" strokeWidth="1" />
              </g>
            </svg>
          ),
        };
      case "支付宝":
        return {
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              height="16"
              width="16"
              className="text-blue-600"
            >
              <desc>Alipay Streamline Icon: https://streamlinehq.com</desc>
              <path
                d="M2.541 0H13.5a2.55 2.55 0 0 1 2.54 2.563v8.297c-0.006 0 -0.531 -0.046 -2.978 -0.813 -0.412 -0.14 -0.916 -0.327 -1.479 -0.536q-0.456 -0.17 -0.957 -0.353a13 13 0 0 0 1.325 -3.373H8.822V4.649h3.831v-0.634h-3.83V2.121H7.26c-0.274 0 -0.274 0.273 -0.274 0.273v1.621H3.11v0.634h3.875v1.136h-3.2v0.634H9.99c-0.227 0.789 -0.532 1.53 -0.894 2.202 -2.013 -0.67 -4.161 -1.212 -5.51 -0.878 -0.864 0.214 -1.42 0.597 -1.746 0.998 -1.499 1.84 -0.424 4.633 2.741 4.633 1.872 0 3.675 -1.053 5.072 -2.787 2.08 1.008 6.37 2.738 6.387 2.745v0.105A2.55 2.55 0 0 1 13.5 16H2.541A2.55 2.55 0 0 1 0 13.437V2.563A2.55 2.55 0 0 1 2.541 0"
                fill="currentColor"
                strokeWidth="1"
              />
              <path
                d="M2.309 9.27c-1.22 1.073 -0.49 3.034 1.978 3.034 1.434 0 2.868 -0.925 3.994 -2.406 -1.602 -0.789 -2.959 -1.353 -4.425 -1.207 -0.397 0.04 -1.14 0.217 -1.547 0.58Z"
                fill="currentColor"
                strokeWidth="1"
              />
            </svg>
          ),
        };
      case "校园卡":
        return {
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              height="20"
              width="20"
              className="text-orange-600"
            >
              <desc>Business Card Streamline Icon</desc>
              <path
                d="M22 4.09H2a2 2 0 0 0 -2 2v11.82a2 2 0 0 0 2 2h20a2 2 0 0 0 2 -2V6.09a2 2 0 0 0 -2 -2ZM3.88 7.83a1 1 0 0 1 1 -1h3.46a1 1 0 0 1 1 1v3.46a1 1 0 0 1 -1 1H4.88a1 1 0 0 1 -1 -1Zm4.85 9H3.88a0.75 0.75 0 1 1 0 -1.5h4.85a0.75 0.75 0 0 1 0 1.5Zm11.17 0h-4.63a0.75 0.75 0 0 1 0 -1.5h4.63a0.75 0.75 0 0 1 0 1.5Zm0 -4.09h-6.49a0.75 0.75 0 0 1 0 -1.5h6.49a0.75 0.75 0 0 1 0 1.5Zm0 -4.09h-4.63a0.75 0.75 0 0 1 0 -1.5h4.63a0.75 0.75 0 0 1 0 1.5Z"
                fill="currentColor"
                strokeWidth="1"
              />
            </svg>
          ),
          label: "校园卡",
        };
      case "现金":
        return {
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              height="20"
              width="20"
              className="text-gray-600"
            >
              <desc>Money Wallet Streamline Icon</desc>
              <path
                d="M24 3.8A3.5 3.5 0 0 0 20.5 0.3h-17A3.52 3.52 0 0 0 0 3.8v13A4.52 4.52 0 0 0 3.31 21c12.13 2.83 11.39 2.7 11.93 2.7a2.67 2.67 0 0 0 1.76 -0.59 2.84 2.84 0 0 0 1 -2.31v-9.69A4.27 4.27 0 0 0 14.89 7L4.06 4a0.75 0.75 0 0 1 0.39 -1.45c3.73 1 3.52 1 3.57 1H20.5a0.75 0.75 0 0 1 0 1.5h-5.24a0.25 0.25 0 0 0 -0.24 0.22 0.25 0.25 0 0 0 0.18 0.28 5.72 5.72 0 0 1 3 1.91 0.25 0.25 0 0 0 0.2 0.09h2.1a0.75 0.75 0 0 1 0 1.5h-1a0.24 0.24 0 0 0 -0.2 0.11 0.25 0.25 0 0 0 0 0.22 5.55 5.55 0 0 1 0.28 1.73v6.94a0.25 0.25 0 0 0 0.25 0.25h0.75A3.5 3.5 0 0 0 24 14.8Zm-8.5 11.5a2 2 0 1 1 -2 -2 2 2 0 0 1 2 2Z"
                fill="currentColor"
                strokeWidth="1"
              />
            </svg>
          ),
        };
    }
  };

  const methodInfo = getMethodInfo();

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium `}
    >
      <span className="flex items-center">{methodInfo?.icon}</span>
    </div>
  );
};

export default PaymethodIcon;
