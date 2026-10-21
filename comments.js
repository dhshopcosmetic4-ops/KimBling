// Danh sách tên người dùng ngẫu nhiên
const commentUserNames = [
    "Hồng Loan", "Quang Huy", "Ngọc Mai", "Thanh Trúc", "Hoàng Nam", 
    "Lan Anh", "Gia Bảo", "Mỹ Linh", "Tuấn Kiệt", "Phương Uyên",
    "Bảo Ngọc", "Đức Anh", "Minh Thư", "Khánh Vy", "Hữu Phước",
    "Thùy Trang", "Tấn Phát", "Cẩm Tú", "Quốc Bảo", "Nhã Phương"
];

// Kho 100+ bình luận phân loại chi tiết theo từng chủ đề danh mục
const commentsByCategory = {
    // 1. CHỦ ĐỀ CÀ PHÊ
    Coffee: [
        "Cà phê ở đây thơm nức mũi, vị đắng thanh uống rất vừa miệng!",
        "Món bạc xỉu béo thơm ngậy luôn, đúng gu mình tìm bấy lâu nay 😍",
        "Sáng nào cũng phải ghé làm một ly cà phê muối cho tỉnh táo làm việc.",
        "Cà phê đậm đà, uống vào tỉnh cả người, giao tới vẫn giữ nguyên đá mát lạnh.",
        "Gu cà phê đậm chất, không bị đắng chát, chấm 10/10 điểm nha quán!",
        "Chủ quán pha cà phê rất chuẩn vị, uống bao nghiền luôn.",
        "Món cà phê sữa đá đậm đà đắng ngọt vừa phải, uống cực dính.",
        "Đúng vị cà phê pha phin truyền thống, thơm ngon đậm vị!",
        "Cà phê đượm vị thơm nức, không bị loãng đá khi ship tới."
    ],

    // 2. CHỦ ĐỀ TRÀ SỮA
    MilkTea: [
        "Trà sữa béo thơm, không bị ngọt gắt, topping cho quá trời luôn!",
        "Trân châu dai ngon, uống ly này bao no luôn nha mọi người.",
        "Đã thử trà sữa trân châu đường đen, đậm vị trà béo vị sữa cực thích.",
        "Trà đậm thơm nức mũi, uống đớp miếng trân châu giòn sần sật đã ghê.",
        "Mong quán giữ vững phong độ pha trà sữa ngon đỉnh thế này nhé!",
        "Vị trà đậm đà vừa phải, không bị ngọt gắt cổ, topping ngập tràn ly.",
        "Trà sữa thơm lừng, gọi béo béo đúng chuẩn gu mười điểm!",
        "Topping pudding với trân châu siêu nhiều, uống bao đã."
    ],

    // 3. CHỦ ĐỀ SỮA CHUA
    Yogurt: [
        "Sữa chua chua chua ngọt ngọt thanh mát, giải nhiệt mùa này là số 1!",
        "Sữa chua dẻo mịn, thơm béo ăn hoài không thấy chán.",
        "Kết nhất món sữa chua ở quán, ăn cùng topping siêu dính luôn.",
        "Vị sữa chua tự nhiên dẻo thơm ngon miệng, lại còn đẹp da nữa.",
        "Giao hàng tới sữa chua vẫn lạnh mát dẻo mịn, mười điểm chất lượng."
    ],

    // 4. CHỦ ĐỀ ĐỒ ĂN VẶT
    Food: [
        "Đồ ăn vặt mang tới còn nóng hổi giòn rụm luôn nha mọi người!",
        "Món mì với đồ chiên ướp gia vị siêu vừa ăn, chấm tương cay xé lưỡi đã quá.",
        "Chân gà sốt thái giòn sần sật, vị chua cay đậm đà dính vô cùng 🤤",
        "Quán làm đồ ăn sạch sẽ, đóng gói cẩn thận tỉ mỉ lắm.",
        "Món này nhâm nhi lúc xem phim hay ngồi chém gió là hết bài luôn.",
        "Ăn vặt giá sinh viên mà chất lượng đỉnh kkk, sẽ ủng hộ quán dài dài!",
        "Các món chiên không bị ngập dầu, ăn giòn thơm ngon miệng."
    ],

    // 5. BÌNH LUẬN CHUNG (Dùng làm backup hoặc trộn ngẫu nhiên)
    General: [
        "Quán này freeship nhanh lắm mọi người ơi, shipper thân thiện ghê.",
        "Đã uống thử nhiều lần và lần nào cũng cực kỳ ưng ý!",
        "Đóng gói ly chén rất cẩn thận, không lo ngã đổ khi ship.",
        "Giá cả hợp lý mà chất lượng nước uống xịn xò 💯",
        "Chủ quán dễ thương nhiệt tình, phục vụ nhanh chóng.",
        "Shop này uy tín nha, giao hàng thần tốc trong một nốt nhạc."
    ]
};
