// ==========================================
// FILE DỮ LIỆU: cntik.js
// Cẩm nang quay & dựng siêu chi tiết (Khoảng cách cm, góc độ, tốc độ lia và CapCut)
// ==========================================

const descriptionsMap = {
    "matcha latte": "Matcha Uji đậm vị quyện sữa tươi béo ngậy, thanh mát dịu nhẹ tan ngay đầu lưỡi.",
    "matcha bac ha": "Sự kết hợp hoàn hảo giữa matcha đậm đà và bạc hà mát lạnh, đập tan cái nóng tức thì.",
    "matcha ca phe": "Vị đắng thanh của matcha hòa quyện cùng cà phê nguyên chất, thức tỉnh năng lượng cả ngày.",
    "matcha dau": "Matcha thơm dịu hòa cùng vị dâu tây chua ngọt mọng nước, béo mịn xinh xắn.",
    "matcha oreo": "Matcha đậm vị kết hợp bánh Oreo giòn rụm béo béo, nhai vui miệng không thể dừng.",
    "matcha chuoi": "Matcha đắng nhẹ quyện nhịp cùng chuối thơm ngọt tự nhiên, lạ miệng béo ngậy.",
    "matcha socola oreo": "Sự bùng nổ vị giác từ matcha, socola đậm đặc và vụn Oreo giòn tan béo ngậy.",
    "matcha viet quat": "Matcha thanh mát quyện sốt việt quất chua ngọt mọng nước độc lạ cuốn hút.",
    "matcha yen mach": "Matcha Uji đậm đà quyện sữa yến mạch bùi thơm tốt cho sức khỏe.",
    "matcha latte kem machiato": "Matcha thơm béo ngập tràn lớp kem machiato mằn mặn béo ngậy sánh mịn.",

    "tra nho xanh mau don": "Hương vị siêu phẩm thơm mát vị nho xanh mẫu đơn thượng hạng, ngọt thanh giòn giòn cực đã.",
    "tra sua o long lai": "Trà ô long lài thơm ngát đặc trưng quyện trân châu đen dẻo dai béo ngậy.",
    "tra sua truyen thong": "Trà sữa béo thơm chuẩn vị truyền thống, ngọt thanh dễ chịu kèm trân châu dai giòn.",
    "tra sua socola": "Trà sữa béo ngậy hòa quyện socola nguyên chất đậm đặc, thơm nức mũi.",
    "tra sua yen mach": "Trà sữa béo mịn kết hợp hạt yến mạch bùi bùi thơm ngon, bổ dưỡng khó cưỡng.",
    "tra sua khoai mon": "Vị khoai môn bùi bùi đặc trưng đượm trong từng ngụm trà sữa ngọt ngào.",
    "tra sua matcha": "Trà xanh thanh mát đan xen lớp sữa béo mịn màng, đậm đà chuẩn gu ghiền.",
    "tra sua than tre": "Sắc đen huyền bí, vị trà thanh dịu kết hợp độ béo nhẹ thanh lọc cơ thể cực đỉnh.",
    "khoai mon latte kem": "Khoai môn bùi béo phủ lớp kem béo ngậy sánh mịn ngọt ngào ngất ngây.",
    "hong tra tac": "Hồng trà đậm đà đượm vị tắc tươi chua ngọt, giải khát cực nhanh.",
    "tra tac thai": "Trà Thái thơm đặc trưng hòa vị tắc tươi chua dịu, giải khát tức thì.",
    "hong tra xi muoi": "Hồng trà kết hợp xí muội mặn ngọt chua thanh kích thích vị giác cực mạnh.",
    "hong tra dau": "Hồng trà đậm vị thơm ngát hương dâu tây tươi mọng chua ngọt sảng khoái.",
    "hong tra dao": "Hồng trà thơm đậm kết hợp những miếng đào giòn ngọt đập tan cơn khát.",
    "hong tra xoai": "Hồng trà thơm lừng đượm vị xoài chín ngọt mát đỉnh cao.",
    "hong tra dua luoi": "Hồng trà thanh mát thơm ngát hương dưa lưới ngọt lịm lịm tim.",
    "hong tra viet quat": "Hồng trà đậm đà quyện vị việt quất chua ngọt mọng nước.",
    "hong tra vai": "Hồng trà thanh tao thoảng hương vải thiều ngọt ngào mọng nước.",
    "hong tra oi": "Hồng trà thơm đậm quyện vị ổi hồng giòn ngọt độc lạ.",
    "hong tra mang cau": "Hồng trà kết hợp mãng cầu xiêm chua ngọt thơm lừng tê tái.",
    "hong tra dau tam": "Hồng trà đượm vị dâu tầm chua ngọt đậm đà kích thích vị giác.",
    "hong tra chanh day": "Hồng trà chanh dây chua ngọt thanh mát, nạp lại năng lượng tức thì.",
    "hong tra me": "Hồng trà me chua ngọt đậm đà kèm đậu phộng bùi bùi ăn là ghiền.",

    "ca phe den da": "Cà phê phin Trung Nguyên đậm đà nguyên bản, đắng thanh bừng tỉnh tinh thần.",
    "ca phe sua da": "Hương cà phê rang xay đậm đặc hòa quyện sữa đặc ngọt béo sảng khoái bất tận.",
    "ca phe muoi": "Cà phê đắng đậm phủ lớp kem muối mặn mặn béo ngậy đánh thức mọi giác quan.",
    "bac siu da": "Nền sữa tươi ngọt ngào thơm thoảng vị cà phê nhẹ nhàng, êm dịu dễ nghiện.",
    "ca phe trung sua": "Lớp kem trứng vàng sánh mịn, đánh bông béo ngậy ngập tràn trên nền cà phê đậm đà.",
    "ca phe bot bien": "Bọt cà phê Dalgona bồng bềnh mịn màng trên ly sữa tươi mát lạnh cực chill.",
    "ca phe pha may": "Espresso chiết xuất chuẩn máy thơm nồng nàn, đậm vị nguyên bản từng giọt.",
    "ca phe sua pha may": "Cà phê máy đậm đặc hòa quyện sữa đặc sánh mịn, ngọt ngào thơm phức.",
    "ca phe sua caramel": "Cà phê thơm lừng tưới đẫm sốt caramel ngọt ngào, quyến rũ trong từng ngụm.",
    "ca phe yen mach": "Cà phê đậm vị kết hợp sữa yến mạch thơm bùi dinh dưỡng, healthy khó cưỡng.",
    "ca phe sua chuoi": "Sự kết hợp độc lạ giữa cà phê đậm đà và hương chuối thơm ngọt béo mịn.",
    "cacao latte": "Cacao nguyên chất đậm đặc sánh mịn cùng sữa tươi, ấm áp ngọt ngào.",
    "cacao pho mai sua": "Cacao đắng dịu quyện lớp phô mai béo ngậy mặn mặn tan chảy trong lồng ngực.",
    "cacao chuoi": "Hương cacao đậm đà thơm lừng vị chuối chín ngọt tự nhiên, béo mịn lạ miệng.",
    "cacao oreo": "Cacao đậm đặc kết hợp Oreo giòn rụm tan chảy béo ngậy siêu bánh cuốn.",
    "cacao bac ha": "Cacao đậm vị điểm xuyết hương bạc hà the mát sảng khoái đến tận tim.",
    "cacao latte kem machiato": "Cacao đậm đặc phủ lớp kem machiato béo ngậy mằn mặn siêu hấp dẫn.",
    "cafe mat ong": "Cà phê đậm đà hòa quyện vị ngọt thanh tự nhiên từ mật ong nguyên chất.",

    "hoa anh dao": "Hương hoa anh đào ngọt ngào lãng mạn kết hợp kem béo hoặc sốt trái cây mọng nước.",
    "hoa anh dao oreo": "Hương anh đào thơm ngọt quyện vụn bánh Oreo giòn rụm béo béo độc lạ.",
    "soda viet quat": "Soda nổ bọt mát lạnh chua ngọt vị việt quất tươi mọng cùng thạch dẻo dai.",
    "soda dau": "Soda trái cây gas nhẹ ngập tràn hương dâu tây ngọt ngào và thạch giòn sần sật.",
    "soda bac ha": "Đập tan cơn khát với soda bạc hà siêu the mát cùng thạch dẻo giòn cực đã.",
    "soda dao": "Soda đào thơm ngọt lịm kết hợp thạch trái cây dai giòn sảng khoái tột đỉnh.",
    "soda xoai": "Vị xoài chín mọng ngọt mát trong từng ngụm soda nổ bọt vui miệng.",
    "soda oi": "Hương ổi hồng thơm lừng đặc trưng quyện soda mát lạnh và thạch giòn.",
    "soda mang cau": "Mãng cầu chua chua ngọt ngọt độc lạ, giải nhiệt cực mạnh ngày nắng.",

    "ly 1 lit bi dao": "Trà bí đao ngọt thanh mát lạnh ly khổng lồ 1 Lít uống ngập ngụa đã cái nết.",
    "ly 1 lit hoa cuc": "Trà hoa cúc thanh dịu ngọt mát, giải nhiệt thanh lọc cơ thể dung tích siêu to.",
    "ly 1 lit rong bien": "Rong biển sương sáo hạt chia thanh mát, giải nhiệt độc đáo ly 1 lít sảng khoái.",
    "ly 1 lit tra tac": "Trà tắc chua ngọt sảng khoái đập tan khát khô cổ họng dung tích 1 lít khổng lồ.",
    "tra da duong": "Trà đá đường ngọt mát bình dân, giải khát nhanh chóng tức thì.",
    "milo dam": "Milo đậm đặc dầm đá mát lạnh ngập tràn sốt béo ngậy và topping giòn rụm.",
    "khoai mon": "Khoai môn bùi béo tự nhiên quyện sữa tươi mềm mịn ngọt dịu ngất ngây.",
    "sam dua sua": "Hương sâm dứa thơm lừng quen thuộc quyện sữa ngậy mát lạnh lịm tim.",
    "sua tuoi tran chau duong den": "Trân châu đường đen dẻo ấm ngọt lịm rót quanh ly sữa tươi thanh mát.",
    "oreo latte": "Sữa tươi latte thơm béo kết hợp vụn bánh Oreo giòn tan béo ngậy.",
    "viet quat latte": "Vị việt quất chua ngọt mọng nước hòa quyện sữa tươi béo mịn màng.",
    "dau latte": "Dâu tây tươi mọng ngọt ngào quyện cùng sữa tươi béo ngậy xinh xắn.",
    "dao latte": "Đào thơm ngọt thanh mát quyện lớp sữa tươi mềm mịn cực chill.",
    "xoai latte": "Xoài chín vàng ngọt lịm thơm phức quyện sữa tươi béo ngậy.",
    "sua dua suong sao": "Nước cốt dừa thơm béo ngậy quyện sương sáo thanh mát giòn dai sần sật.",
    "da me": "Đá me chua ngọt mát lạnh lịm tim, thêm đậu phộng bùi bùi và hạt đát dẻo dai.",
    "hojicha latte": "Trà xanh nướng Hojicha thơm mùi khói đặc trưng quyện sữa tươi béo dịu.",
    "socola chuoi oreo": "Sự kết hợp đỉnh cao giữa socola đậm đặc, chuối thơm và Oreo giòn béo.",
    "sua tuyet": "Thức uống xay mịn màng mát lạnh ngập tràn vị trái cây và kem béo ngậy thượng hạng.",
    "lipton latte": "Trà Lipton đậm đà quen thuộc quyện lớp sữa tươi béo ngậy thơm ngon khó cưỡng.",
    "banh flan": "Bánh flan béo ngậy thơm mùi trứng sữa chan sốt cà phê đắng thanh cực đỉnh.",

    "sua chua kem": "Sữa chua sánh mịn chua ngọt mát lạnh phủ lớp kem béo ngậy.",
    "sua chua pho mai": "Sữa chua lên men sánh mịn hòa quyện phô mai béo ngậy tan chảy trong miệng.",
    "sua chua viet quat": "Sữa chua việt quất chua ngọt mọng nước mát lạnh ly khổng lồ 1 lít sảng khoái.",
    "sua chua dau tay": "Sữa chua dâu tây kết hợp Oreo giòn rụm béo béo chua ngọt ly 1 lít siêu cuốn.",
    "sua chua dao": "Sữa chua đào thơm ngọt thanh mát ly khổng lồ 1 lít ăn hoài không ngán.",
    "sua chua xoai": "Sữa chua xoài chín mọng ngọt lịm thơm mát ly 1 lít đã thèm.",
    "sua chua oi hong": "Sữa chua ổi hồng thơm lừng độc lạ chua ngọt mát lạnh ly 1 lít.",
    "sua chua chuoi": "Sữa chua chuối béo ngậy thơm ngọt tự nhiên ly 1 lít dinh dưỡng.",
    "sua chua dua luoi": "Sữa chua dưa lưới ngọt mát thơm lừng giải nhiệt cực mạnh ly 1 lít.",
    "sua chua ca phe": "Sữa chua chua dịu kết hợp chút đắng nhẹ của cà phê lạ miệng khó quên.",
    "sua chua matcha": "Sữa chua sánh mịn kết hợp vị matcha thơm thanh độc đáo.",

    "chan ga": "Chân gà rút xương giòn sần sật đẫm sốt Thái chua cay mặn ngọt đậm đà kích thích.",
    "lap xuong": "Lạp xưởng tươi nướng đá thơm nức mũi, thịt mọng nước nóng hổi cắn ngập răng.",
    "sua sot thai": "Sứa tươi sần sật trộn sốt Thái chua cay đậm đà chuẩn vị lai rai nhức nách.",
    "ca vien": "Cá viên chiên vàng giòn rụm thơm phức, chấm tương đậm đà ăn hoài không ngán.",
    "sot pho mai": "Đẫm ngập sốt phô mai béo ngậy vàng óng kéo sợi thơm phức.",
    "sot mam toi": "Phủ đầy sốt mắm tỏi phi thơm lừng đậm đà mặn ngọt cực kỳ đưa miệng.",
    "sot trung suoi": "Sốt trứng muối béo ngậy vàng ươm mặn mặn bùi bùi phủ kín món ăn.",
    "tokbokki": "Bánh gạo Hàn Quốc dẻo mềm đẫm sốt cay nồng và phô mai kéo sợi ngậy béo.",
    "banh gao tokbokki nuong": "Bánh gạo nướng vỏ giòn tan chấm kèm sốt phô mai sữa béo ngậy thơm lừng.",
    "banh trang": "Mẹt bánh tráng dẻo thơm đủ vị chấm kèm sốt bơ me chua cay đậm đà ăn là nghiện.",
    "com chien": "Cơm chiên hạt vàng giòn tơi xốp đậm đà gia vị thơm ngon ấm bụng.",
    "goi du du": "Đu đủ bào giòn sần sật trộn khô bò đen Tây Ninh đậm đà, nước sốt chua ngọt chuẩn vị.",
    "mi suon uc ga": "Tô mì nóng hổi topping sườn ức gà mềm thơm đẫm sốt phô mai cay nồng siêu đã.",
    "mi suon canh ga bbq": "Tô mì nóng hổi kết hợp cánh gà BBQ đẫm sốt đậm đà phô mai cay kích thích vị giác.",
    "mi tuong den": "Mì trộn sốt tương đen Hàn Quốc đậm đà chuẩn vị, óng ánh thơm phức.",
    "mi tron": "Mì trộn đậm vị sốt đặc biệt ăn kèm topping ngập tràn giòn dai no căng bụng.",
    "canh ga bbq": "Cánh gà chiên giòn rụm áo lớp sốt BBQ đậm đà, thơm lừng mặn ngọt siêu cuốn.",
    "bot chien canh ga bbq": "Cánh gà tẩm bột chiên giòn rụm đẫm sốt BBQ và phô mai béo ngậy thơm phức."
};

const hooksLibrary = {
    'tra-sua-cafe': [
        { id: 'hook-canh-bao', badge: '🔥 Trend Cảnh Báo', title: 'Cảnh báo gây nghiện cực mạnh', speech: (dish) => `"Cảnh báo! Đừng uống thử ${dish || 'món này'} nếu không muốn nghiện từ ngụm đầu!"` },
        { id: 'hook-asmr', badge: '🎧 Trend ASMR', title: 'Cận cảnh âm thanh đá & rót trà', speech: (dish) => `"(Tiếng đá rào rào) Trời nóng thế này pha ngay một ly ${dish || 'đặc biệt'} mát lạnh!"` },
        { id: 'hook-thach-thuc', badge: '💥 Trend Thách Thức', title: 'Thử thách tìm quán ngon hơn', speech: (dish) => `"Đố các bác tìm được ở đâu bán ${dish || 'món này'} mà topping ngập tràn như Kim Bling!"` },
        { id: 'hook-tam-su', badge: '🥺 Trend Tâm Sự', title: 'Kể chuyện tâm huyết làm nghề', speech: (dish) => `"Nhiều khách hỏi sao ${dish || 'món này'} bên quán lúc nào cũng đông khách đặt thế..."` },
        { id: 'hook-gia-soc', badge: '💸 Trend Giá Sốc', title: 'Bất ngờ với mức giá siêu hời', speech: (dish) => `"Tin được không? Một ly ${dish || 'siêu to khổng lồ'} đầy ú ụ thế này mà giá siêu rẻ!"` }
    ],
    'an-vat-nuong': [
        { id: 'hook-keo-soi', badge: '🧀 Trend Kéo Sợi', title: 'Cận cảnh phô mai / sốt chảy', speech: (dish) => `"Nhìn sợi phô mai kéo dài thế này thì ai mà chịu nổi với món ${dish || 'này'} cơ chứ!"` },
        { id: 'hook-xeo-xeo', badge: '🔥 Trend Xèo Xèo', title: 'Âm thanh nướng/chiên giòn rụm', speech: (dish) => `"(Tiếng xèo xèo) Nghe tiếng ${dish || 'đồ ăn'} chín vàng trên bếp thôi là réo ầm ĩ rồi!"` },
        { id: 'hook-hoi-dap', badge: '💬 Trend Hỏi Đáp', title: 'Trả lời bình luận của khách', speech: (dish) => `"Có bạn hỏi quán em có bán ${dish || 'món này'} ship tận nơi không? Có luôn nha!"` },
        { id: 'hook-canh-bao-an', badge: '🚨 Trend Cấm Xem Đêm', title: 'Cảnh báo cấm xem sau 10h đêm', speech: (dish) => `"Ai đang giảm cân hoặc xem clip này sau 10 giờ đêm thì lướt qua gấp món ${dish || 'này'} nhé!"` },
        { id: 'hook-full-topping', badge: '🍖 Trend Đầy Ú Ụ', title: 'Bóc giá phần ăn siêu nhiều', speech: (dish) => `"Đố các bác đoán được phần ${dish || 'ăn vặt'} đầy ú ụ như núi này bao nhiêu tiền?"` }
    ],
    'phun-xam-tham-my': [
        { id: 'hook-lot-xac', badge: '✨ Trend Lột Xác', title: 'Biến hình Trước & Sau ngoạn mục', speech: () => '"Chân mày thưa nhạt, môi thâm xỉn khiến chị em mất tự tin khi để mặt mộc..."' },
        { id: 'hook-sai-lam', badge: '⚠️ Trend Cảnh Báo', title: '3 sai lầm khi đi phun xăm', speech: () => '"Đừng vội đi phun mày, phun môi nếu chưa biết 3 điều cực kỳ quan trọng này!"' },
        { id: 'hook-khong-dau', badge: '😴 Trend Ngủ Quên', title: 'Làm đẹp êm như đi spa', speech: () => '"Ai bảo đi phun xăm đau sưng? Khách nhà em còn nằm ngủ quên luôn đây này!"' },
        { id: 'hook-sua-loi', badge: '🛠️ Trend Giải Cứu', title: 'Giải cứu ca mày/môi hỏng', speech: () => '"Tiếp nhận một ca khách làm hỏng ở nơi khác tới cầu cứu Kim Bling..."' },
        { id: 'hook-uu-dai-lam-dep', badge: '🎁 Trend Ưu Đãi', title: 'Tặng suất làm đẹp giá trải nghiệm', speech: () => '"Duy nhất tuần này, Kim Bling dành tặng suất phun mày/môi giá sốc!"' }
    ],
    'dao-tao-phun-xam': [
        { id: 'hook-hoc-nghe', badge: '🎓 Trend Hướng Nghiệp', title: 'Chọn nghề thu nhập cao', speech: () => '"Không cần bằng đại học, chỉ 1 tháng học vững tay nghề tự tin kiếm tiền triệu!"' },
        { id: 'hook-so-sanh-da-gia', badge: '✍️ Trend Thực Chiến', title: 'Từ giấy đến mẫu thật', speech: () => '"Học viên tại Kim Bling được thực hành trực tiếp trên mẫu thật 100%!"' },
        { id: 'hook-tam-su-nghe', badge: '❤️ Trend Truyền Cảm Hứng', title: 'Thay đổi cuộc sống', speech: () => '"Từ con số 0 nay các bạn đã tự chủ tài chính và làm chủ cuộc đời mình!"' },
        { id: 'hook-boc-phot-day', badge: '🔍 Trend Minh Bạch', title: 'Học phí trọn gói', speech: () => '"Tặng trọn bộ đồ nghề cao cấp, cam kết không phát sinh chi phí!"' },
        { id: 'hook-tuyen-sinh', badge: '📢 Trend Tuyển Sinh', title: 'Ưu đãi khóa mới', speech: () => '"Khai giảng khóa mới, giảm ngay 50% học phí cho 5 bạn đăng ký sớm!"' }
    ],
    'vlog-doi-thuong': [
        { id: 'hook-5h-sang', badge: '🌅 Trend 5H Sáng', title: '1 ngày làm chủ quán', speech: () => '"Cùng theo chân em xem 1 ngày làm chủ quán Kim Bling từ 5h sáng có gì nhé!"' },
        { id: 'hook-chot-don', badge: '📦 Trend Bão Đơn', title: 'Đóng đơn mỏi tay', speech: () => '"Giờ cao điểm tại Kim Bling khi đơn hàng nổ ting ting không kịp thở..."' },
        { id: 'hook-khoi-nghiep', badge: '💪 Trend Khởi Nghiệp', title: 'Sự thật mở quán', speech: () => '"Nhiều người nghĩ làm chủ quán nhàn hạ, nhưng thực tế thế này đây..."' },
        { id: 'hook-mon-moi', badge: '🧪 Trend Test Món', title: 'Nghiên cứu món mới', speech: () => '"Hôm nay cùng em vào bếp test thử công thức món mới ra mắt menu nhé!"' },
        { id: 'hook-goc-chill', badge: '✨ Trend Góc Chill', title: 'Quán lên đèn buổi tối', speech: () => '"Khoảnh khắc em thích nhất là lúc quán nhỏ bắt đầu lên đèn lung linh..."' }
    ]
};

const pmuSubData = {
    may: {
        label: 'Phun / Điêu Khắc Mày',
        steps: [
            {
                title: 'Phân đoạn 1: Mở đầu Hook (Quay 5s -> Cắt còn 3s)',
                time: 'Quay 5s (Cắt trước/sau 1s còn 3s)',
                isHookStep: true,
                motionGuide: '🎯 [Cự ly 30-40cm | Góc 60 độ] Lao máy nhanh sát chân mày trong 1s rồi giữ yên.',
                speech: () => `"Cảnh báo! Đừng bỏ qua siêu phẩm chân mày này!"`
            },
            {
                title: 'Phân đoạn 2: Thao tác thực hiện (4 đoạn x 7s = 28s -> Cắt còn 20s)',
                time: 'Tổng 28s (4 đoạn nhỏ x 7s, cắt còn 20s)',
                isMultiSegment: true,
                subClips: [
                    { id: 0, name: 'Đoạn 2.1: Sát khuẩn & ủ tê', motionGuide: '🎯 [Cự ly 20cm | Góc 0 độ] Quét nhanh tay thoa tê êm ái.', speech: 'Vô trùng sạch sẽ, ủ tê êm ái.' },
                    { id: 1, name: 'Đoạn 2.2: Đo vẽ tỉ lệ vàng', motionGuide: '🎯 [Cự ly 25cm | Góc 45 độ] Lao máy nhanh sát thước đo tỉ lệ.', speech: 'Đo vẽ tỉ lệ vàng chuẩn xác.' },
                    { id: 2, name: 'Đoạn 2.3: Đi kim rải hạt', motionGuide: '🎯 [Cự ly 15cm | Góc 90 độ] Quét chớp nhoáng đầu kim đi hạt tơi mịn.', speech: 'Kỹ thuật đi kim rải hạt tơi mịn.' },
                    { id: 3, name: 'Đoạn 2.4: Lau bông lộ mực', motionGuide: '🎯 [Cự ly 20cm | Góc 45 độ] Hất nhanh máy khăn bông lướt lộ dáng mày.', speech: 'Lau bông lộ mực sắc nét tự nhiên.' }
                ],
                motionGuide: 'Quay từng đoạn nhỏ 7 giây để cắt bớt trước sau.',
                speech: () => 'Quá trình thực hiện tỉ mỉ từng chi tiết.'
            },
            {
                title: 'Phân đoạn 3: Thành phẩm & CTA (Quay 6s -> Cắt còn 4s)',
                time: 'Quay 6s (Cắt trước/sau 1s còn 4s)',
                motionGuide: '🎯 [Cự ly 30-50cm | Góc ngước 15 độ] Hất nhanh máy từ gương ra nụ cười rạng rỡ.',
                speech: () => '"Mới làm xong trẻ ra cả chục tuổi, inbox ngay nhé!"'
            }
        ]
    },
    moi: {
        label: 'Phun / Khử Thâm Môi',
        steps: [
            {
                title: 'Phân đoạn 1: Mở đầu Hook (Quay 5s -> Cắt còn 3s)',
                time: 'Quay 5s (Cắt trước/sau 1s còn 3s)',
                isHookStep: true,
                motionGuide: '🎯 [Cự ly 30-40cm | Góc 60 độ] Lao máy nhanh sát vào môi trong 1s rồi dừng.',
                speech: () => `"Đừng bỏ qua siêu phẩm môi hồng hào này!"`
            },
            {
                title: 'Phân đoạn 2: Thao tác thực hiện (4 đoạn x 7s = 28s -> Cắt còn 20s)',
                time: 'Tổng 28s (4 đoạn nhỏ x 7s, cắt còn 20s)',
                isMultiSegment: true,
                subClips: [
                    { id: 0, name: 'Đoạn 2.1: Sát khuẩn & ủ tê', motionGuide: '🎯 [Cự ly 20cm | Góc 0 độ] Quét nhanh miếng ủ tê môi.', speech: 'Vô trùng sạch sẽ, ủ tê thư giãn.' },
                    { id: 1, name: 'Đoạn 2.2: Khử gốc thâm', motionGuide: '🎯 [Cự ly 25cm | Góc 45 độ] Lao máy sát nền môi đi tinh chất.', speech: 'Tinh chất khử sạch gốc thâm đen.' },
                    { id: 2, name: 'Đoạn 2.3: Cấy màu hữu cơ', motionGuide: '🎯 [Cự ly 15cm | Góc 90 độ] Quét chớp nhoáng đầu máy cấy màu.', speech: 'Cấy màu hữu cơ trong veo mướt mịn.' },
                    { id: 3, name: 'Đoạn 2.4: Lau bông lộ màu', motionGuide: '🎯 [Cự ly 20cm | Góc 45 độ] Hất nhanh máy khăn bông lộ sắc môi.', speech: 'Màu lên trong veo chuẩn tông ngay.' }
                ],
                motionGuide: 'Quay từng đoạn nhỏ 7 giây để cắt bớt trước sau.',
                speech: () => 'Quy trình khử thâm cấy màu chuẩn y khoa.'
            },
            {
                title: 'Phân đoạn 3: Thành phẩm & CTA (Quay 6s -> Cắt còn 4s)',
                time: 'Quay 6s (Cắt trước/sau 1s còn 4s)',
                motionGuide: '🎯 [Cự ly 30-50cm | Góc ngước 15 độ] Hất nhanh máy thoa dưỡng và đôi môi bắt sáng.',
                speech: () => '"Môi căng mọng tức thì, nhận ưu đãi ngay bên dưới nhé!"'
            }
        ]
    }
};

const categoriesData = [
    {
        id: 'tra-sua-cafe',
        name: 'Trà Sữa & Cà Phê (Kim Bling)',
        icon: '🧋',
        desc: 'Review chân thực từ menu quán',
        supportsCustomDish: true,
        inputLabel: 'Nhập tên món nước:',
        placeholder: 'VD: Matcha Latte, Cà phê muối...',
        quickDishes: ['Matcha Latte', 'Trà nho xanh mẫu đơn', 'Cà phê muối', 'Trà sữa truyền thống'],
        steps: [
            {
                title: 'Phân đoạn 1: Mở đầu Hook (Quay 5s -> Cắt còn 3s)',
                time: 'Quay 5s (Cắt trước/sau 1s còn 3s)',
                isHookStep: true,
                motionGuide: '🎯 [Cự ly 30-40cm | Góc 60 độ] Lao máy nhanh sát vào ly nước trong 1s rồi dừng.',
                speech: (dish) => `"Cảnh báo! Đừng uống thử ${dish || 'món này'} nếu không muốn nghiện!"`
            },
            {
                title: 'Phân đoạn 2: Thao tác pha chế (4 đoạn x 7s = 28s -> Cắt còn 20s)',
                time: 'Tổng 28s (4 đoạn nhỏ x 7s, cắt còn 20s)',
                isMultiSegment: true,
                subClips: [
                    { id: 0, name: 'Đoạn 2.1: Cho đá viên rào rào', motionGuide: '🎯 [Cự ly 20cm | Góc 0 độ] Lao máy sát miệng ly lúc đá rơi xuống.', speech: 'Tiếng đá rơi mát lạnh sảng khoái.' },
                    { id: 1, name: 'Đoạn 2.2: Rót cốt trà/cà phê sóng sánh', motionGuide: '🎯 [Cự ly 25-30cm | Góc 45 độ chuẩn] Quét nhanh theo dòng nước chảy.', speech: 'Rót cốt nguyên liệu đậm đà chuẩn vị.' },
                    { id: 2, name: 'Đoạn 2.3: Thêm lớp kem machiato/sữa', motionGuide: '🎯 [Cự ly 15cm | Góc 90 độ] Đưa máy sát lớp kem béo ngậy chảy tràn.', speech: 'Phủ lớp kem machiato mằn mặn béo ngậy.' },
                    { id: 3, name: 'Đoạn 2.4: Thêm muỗng topping đầy ắp', motionGuide: '🎯 [Cự ly 20cm | Góc 45 độ] Hất nhanh máy múc muỗng topping vun vút.', speech: 'Topping nhà làm dai giòn sần sật ngập tràn.' }
                ],
                motionGuide: 'Quay từng đoạn nhỏ 7 giây để cắt bớt trước sau.',
                speech: (dish) => `Pha chế siêu phẩm ${dish || 'nước ngon'} hấp dẫn.`
            },
            {
                title: 'Phân đoạn 3: Thành phẩm & CTA (Quay 6s -> Cắt còn 4s)',
                time: 'Quay 6s (Cắt trước/sau 1s còn 4s)',
                motionGuide: '🎯 [Cự ly 30-50cm | Góc ngước 15 độ] Hất nhanh máy lướt 1 vòng quanh ly nước.',
                speech: () => `"Ngon nhức nách 10 điểm, ghé Kim Bling ngay nhé!"`
            }
        ]
    },
    {
        id: 'an-vat-nuong',
        name: 'Đồ Ăn Vặt & Nướng (Kim Bling)',
        icon: '🔥',
        desc: 'Món nóng, sốt ngập tràn, siêu ghiền',
        supportsCustomDish: true,
        inputLabel: 'Nhập tên món ăn:',
        placeholder: 'VD: Chân gà, Lạp xưởng, Tokbokki...',
        quickDishes: ['Chân gà rút xương', 'Lạp xưởng tươi nướng đá', 'Tokbokki', 'Cánh gà BBQ'],
        steps: [
            {
                title: 'Phân đoạn 1: Mở đầu Hook (Quay 5s -> Cắt còn 3s)',
                time: 'Quay 5s (Cắt trước/sau 1s còn 3s)',
                isHookStep: true,
                motionGuide: '🎯 [Cự ly 30-40cm | Góc 60 độ] Lao máy nhanh sát đĩa đồ ăn trong 1s.',
                speech: (dish) => `"Đừng xem clip ${dish || 'này'} lúc nửa đêm nhé!"`
            },
            {
                title: 'Phân đoạn 2: Thao tác chế biến (4 đoạn x 7s = 28s -> Cắt còn 20s)',
                time: 'Tổng 28s (4 đoạn nhỏ x 7s, cắt còn 20s)',
                isMultiSegment: true,
                subClips: [
                    { id: 0, name: 'Đoạn 2.1: Đảo chảo xèo xèo sôi bùng', motionGuide: '🎯 [Cự ly 20cm | Góc 0 độ] Lao sát chảo thức ăn bốc khói ngút ngàn.', speech: 'Chế biến nóng hổi trên chảo sốt.' },
                    { id: 1, name: 'Đoạn 2.2: Rưới đẫm sốt óng ánh', motionGuide: '🎯 [Cự ly 25-30cm | Góc 45 độ] Quét nhanh dòng sốt cay đậm đà.', speech: 'Chan hòa lớp nước sốt béo ngậy đậm đà.' },
                    { id: 2, name: 'Đoạn 2.3: Rắc topping thơm phức', motionGuide: '🎯 [Cự ly 15cm | Góc 90 độ] Đưa tay rắc hành phi/mè thơm xuống.', speech: 'Rắc thêm topping giòn rụm thơm nức mũi.' },
                    { id: 3, name: 'Đoạn 2.4: Múc ra đĩa khói nghi ngút', motionGuide: '🎯 [Cự ly 20cm | Góc 45 độ] Hất nhanh máy múc đĩa đồ ăn nóng giòn.', speech: 'Múc ra đĩa thơm ngon nhức nách.' }
                ],
                motionGuide: 'Quay từng đoạn nhỏ 7 giây để cắt bớt trước sau.',
                speech: (dish) => `Làm món ${dish || 'đồ ăn'} nóng giòn siêu hấp dẫn.`
            },
            {
                title: 'Phân đoạn 3: Thành phẩm & CTA (Quay 6s -> Cắt còn 4s)',
                time: 'Quay 6s (Cắt trước/sau 1s còn 4s)',
                motionGuide: '🎯 [Cự ly 30-50cm | Góc ngước 15 độ] Hất nhanh máy nhúng đũa ngập sốt.',
                speech: () => `"Chấm đẫm sốt ngon xuất sắc, đặt hàng ngay bên dưới nhé!"`
            }
        ]
    },
    {
        id: 'phun-xam-tham-my',
        name: 'Phun Xăm Thẩm Mỹ',
        icon: '✨',
        desc: 'Chuyên sâu Phun Mày & Phun Môi',
        supportsCustomDish: false,
        isPmuCategory: true,
        steps: pmuSubData.may.steps
    },
    {
        id: 'dao-tao-phun-xam',
        name: 'Đào Tạo Phun Xăm (Học Viên)',
        icon: '🎓',
        desc: 'Tuyển sinh, lớp học thực chiến Mày Môi',
        supportsCustomDish: false,
        steps: [
            {
                title: 'Phân đoạn 1: Mở đầu Hook (Quay 5s -> Cắt còn 3s)',
                time: 'Quay 5s (Cắt trước/sau 1s còn 3s)',
                isHookStep: true,
                motionGuide: '🎯 [Cự ly 30-40cm | Góc 60 độ] Lao nhanh lớp học năng lượng.',
                speech: () => '"Không cần bằng đại học, 1 tháng học vững tay nghề kiếm tiền triệu!"'
            },
            {
                title: 'Phân đoạn 2: Thao tác học tập (4 đoạn x 7s = 28s -> Cắt còn 20s)',
                time: 'Tổng 28s (4 đoạn nhỏ x 7s, cắt còn 20s)',
                isMultiSegment: true,
                subClips: [
                    { id: 0, name: 'Đoạn 2.1: Giảng dạy lý thuyết', motionGuide: '🎯 [Cự ly 25cm | Góc 45 độ] Lướt bảng vẽ sơ đồ kỹ thuật.', speech: 'Học từ gốc rễ cấu trúc da chuẩn xác.' },
                    { id: 1, name: 'Đoạn 2.2: Hướng dẫn cầm máy', motionGuide: '🎯 [Cự ly 15cm | Góc 90 độ] Lao sát tay giáo viên chỉ việc.', speech: 'Cầm tay chỉ việc từng mũi kim tơi mịn.' },
                    { id: 2, name: 'Đoạn 2.3: Thực hành da giả', motionGuide: '🎯 [Cự ly 20cm | Góc 45 độ] Quét nhanh học viên luyện tập hăng say.', speech: 'Luyện tập thuần thục trên da giả.' },
                    { id: 3, name: 'Đoạn 2.4: Thực chiến mẫu thật', motionGuide: '🎯 [Cự ly 30cm | Góc 45 độ] Hất nhanh máy học viên làm cho khách.', speech: 'Thực chiến trực tiếp trên mẫu thật tự tin.' }
                ],
                motionGuide: 'Quay từng đoạn nhỏ 7 giây để cắt bớt trước sau.',
                speech: () => 'Quy trình đào tạo bài bản từ A đến Z.'
            },
            {
                title: 'Phân đoạn 3: Thành phẩm & CTA (Quay 6s -> Cắt còn 4s)',
                time: 'Quay 6s (Cắt trước/sau 1s còn 4s)',
                motionGuide: '🎯 [Cự ly 30-50cm | Góc ngước 15 độ] Hất nhanh máy trao chứng chỉ.',
                speech: () => '"Nhận chứng chỉ chính quy, nhanh tay inbox nhận ưu đãi 50%!"'
            }
        ]
    },
    {
        id: 'vlog-doi-thuong',
        name: 'Vlog Đời Thường & Quán',
        icon: '🏡',
        desc: 'Hậu trường mở quán, 1 ngày làm chủ',
        supportsCustomDish: false,
        steps: [
            {
                title: 'Phân đoạn 1: Mở đầu Hook (Quay 5s -> Cắt còn 3s)',
                time: 'Quay 5s (Cắt trước/sau 1s còn 3s)',
                isHookStep: true,
                motionGuide: '🎯 [Cự ly 40-50cm | Góc 45 độ] Lao nhanh mở cửa quán sớm.',
                speech: () => '"Cùng theo chân em xem 1 ngày làm chủ quán Kim Bling từ 5h sáng!"'
            },
            {
                title: 'Phân đoạn 2: Thao tác vận hành quán (4 đoạn x 7s = 28s -> Cắt còn 20s)',
                time: 'Tổng 28s (4 đoạn nhỏ x 7s, cắt còn 20s)',
                isMultiSegment: true,
                subClips: [
                    { id: 0, name: 'Đoạn 2.1: Mở cửa đón bình minh', motionGuide: '🎯 [Cự ly 40cm | Góc 0 độ] Đẩy vào cửa quán lúc sáng sớm.', speech: 'Bắt đầu ngày mới từ 5h sáng năng lượng.' },
                    { id: 1, name: 'Đoạn 2.2: Pha chế liên tay', motionGuide: '🎯 [Cự ly 25cm | Góc 45 độ] Quay team làm đồ uống tấp nập.', speech: 'Pha chế phục vụ khách đông liên tục.' },
                    { id: 2, name: 'Đoạn 2.3: Đóng đơn ship online', motionGuide: '🎯 [Cự ly 20cm | Góc 90 độ] Quay tay dán túi đơn hàng bão táp.', speech: 'Đóng gói đơn hàng gửi đi khắp nơi.' },
                    { id: 3, name: 'Đoạn 2.4: Test công thức món mới', motionGuide: '🎯 [Cự ly 25cm | Góc 45 độ] Quay nếm thử món mới gật đầu ưng ý.', speech: 'Sáng tạo nghiên cứu công thức món mới.' }
                ],
                motionGuide: 'Quay từng đoạn nhỏ 7 giây để cắt bớt trước sau.',
                speech: () => 'Hành trình 1 ngày làm chủ quán tất bật.'
            },
            {
                title: 'Phân đoạn 3: Thành phẩm & CTA (Quay 6s -> Cắt còn 4s)',
                time: 'Quay 6s (Cắt trước/sau 1s còn 3s)',
                motionGuide: '🎯 [Cự ly 50cm | Góc ngước 15 độ] Hất nhanh máy góc quán lên đèn.',
                speech: () => '"Quán lên đèn ấm cúng tuyệt vời, chúc mọi người năng lượng bye bye!"'
            }
        ]
    }
];

function getDynamicHashtags(dishName, catName) {
    let baseTag = dishName ? dishName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '') : catName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
    return [
        `#${baseTag}`,
        `#kimblingcoffeetea`,
        `#reviewanngon`,
        `#xuhuongtiktok`,
        `#viralvideo`
    ];
}

const viralCaptions = [
    "Đừng ai mua/làm sản phẩm này khi chưa xem hết video! Xem xong chỉ muốn chốt đơn ngay lập tức 🤤🔥",
    "Sức hút khó cưỡng từ siêu phẩm Kim Bling đây các bác ơi! Thưởng thức một lần là ghiền, không ngon không lấy tiền ✨",
    "Tận mắt chứng kiến quá trình làm siêu phẩm này mới hiểu vì sao khách xếp hàng dài mỗi ngày 💯",
    "Hôm nay mời mọi người cùng trải nghiệm món hot hit triệu view nhà em nhé. Nhìn có kích thích không ạ? 😍",
    "Trời lạnh/nóng thế này mà có món này thì hết nước chấm! Đang có ưu đãi sốc, bấm vào giỏ hàng ngay 👇"
];

// Cẩm nang chi tiết CapCut cho người mới
const capcutDetailedGuides = [
    {
        tabTitle: '1. Sắp Xếp 1-2-3',
        heading: 'Bước 1: Ghép video theo đúng thứ tự 1 - 2 - 3',
        steps: [
            { title: 'Thứ tự ghép chuẩn', detail: 'Mở CapCut -> Bấm Dự án mới. Đưa video vào theo thứ tự: <strong>Video Phân Đoạn 1 (Hook 3s) -> 4 video Phân Đoạn 2 (Mỗi đoạn 5s) -> Video Phân Đoạn 3 (Thành phẩm 4s)</strong>.' },
            { title: 'Khóa khung dọc 9:16', detail: 'Chọn Tỷ lệ khung hình <strong>9:16</strong> chuẩn TikTok để video hiển thị tràn màn hình điện thoại.' },
            { title: 'Xóa logo kết thúc', detail: 'Kéo thanh thời gian về cuối cùng, bấm vào đoạn kết đen chứa logo CapCut rồi bấm <strong>Xóa (Delete)</strong>.' }
        ]
    },
    {
        tabTitle: '2. Cắt Bớt Đầu/Đuôi',
        heading: 'Bước 2: Cắt bỏ 1s đầu và 1s cuối mỗi video',
        steps: [
            { title: 'Cắt chuẩn xác', detail: 'Do lúc bấm quay tay hay bị rung, anh hãy cắt bỏ đúng 1 giây đầu và 1 giây cuối của mỗi đoạn quay 7s để thu về đúng 5s/đoạn cực kỳ mượt mà.' }
        ]
    },
    {
        tabTitle: '3. Hiệu Ứng Động',
        heading: 'Bước 3: Thêm chuyển cảnh giật beat dồn dập',
        steps: [
            { title: 'Chuyển cảnh Flash', detail: 'Bấm vào ô vuông chuyển cảnh giữa các đoạn video -> Chọn mục <strong>Chớp trắng (Flash)</strong> -> Chỉnh thời lượng ngắn lại <strong>0.2 giây</strong> rồi bấm "Áp dụng cho tất cả".' }
        ]
    },
    {
        tabTitle: '4. Lồng Tiếng & Màu',
        heading: 'Bước 4: Ghi âm & Tăng độ nét',
        steps: [
            { title: 'Ghi âm thuyết minh', detail: 'Về đầu video -> Chọn <strong>Âm thanh (Audio)</strong> -> Chọn <strong>Thu âm (Voiceover)</strong>. Đọc theo lời thoại gợi ý, sau đó giảm âm nhạc nền xuống 10%.' },
            { title: 'Chỉnh màu sắc nét', detail: 'Bấm vào video -> Chọn <strong>Điều chỉnh (Adjust)</strong> hoặc Bộ lọc <strong>Ẩm thực (Food)</strong> mức 35% để video rực rỡ, ngon mắt.' }
        ]
    },
    {
        tabTitle: '5. Xuất File',
        heading: 'Bước 5: Xuất video 1080P 60fps',
        steps: [
            { title: 'Xuất file nét căng', detail: 'Nhìn lên góc phải chọn độ phân giải <strong>1080P</strong> và khung hình <strong>60fps</strong>, sau đó bấm <strong>Xuất (Export)</strong> lưu về máy đăng TikTok!' }
        ]
    }
];
