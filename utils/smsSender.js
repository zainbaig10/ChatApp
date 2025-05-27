import axios from "axios";

export const sendSms = async (phone, message) => {
  let data = JSON.stringify({
    number: [phone],
    message: message,
    senderId: "EDUMRC",
    templateId: "1707168926925165526",
  });

  let config = {
    method: "post",
    url: "https://smsapi.edumarcsms.com/api/v1/sendsms",
    headers: {
      "Content-Type": "application/json",
      apikey: "4994a63a464f4819a366a36d38326845",
    },
    data: data,
  };

  try {
    const response = await axios.request(config);
    console.log("SMS sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending SMS:", error);
  }
};