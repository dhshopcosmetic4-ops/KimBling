// ==========================================
// FILE DỮ LIỆU: tenmon.js
// Quản lý danh mục món ăn, thức uống và phun xăm cho Kim Bling Coffee & Tea
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
    "mi suon canh ga bbq": "Mì nóng hổi kết hợp cánh gà BBQ đẫm sốt đậm đà phô mai cay kích thích vị giác.",
    "mi tuong den": "Mì trộn sốt tương đen Hàn Quốc đậm đà chuẩn vị, óng ánh thơm phức.",
    "mi tron": "Mì trộn đậm vị sốt đặc biệt ăn kèm topping ngập tràn giòn dai no căng bụng.",
    "canh ga bbq": "Cánh gà chiên giòn rụm áo lớp sốt BBQ đậm đà, thơm lừng mặn ngọt siêu cuốn.",
    "bot chien canh ga bbq": "Cánh gà tẩm bột chiên giòn rụm đẫm sốt BBQ và phô mai béo ngậy thơm phức."
};

const pmuSubData = {
    may: {
        label: 'Phun / Điêu Khắc Mày',
        techs: ['Shading bay bay', 'Hairstroke tự nhiên', 'Xử lý mày trổ', 'Mày phong thủy'],
        steps: [
            {
                title: 'Bước 1: Mở đầu Hook (9s - 3 đoạn)',
                time: '0 - 9s',
                clips: [
                    { name: 'Đoạn 1: Cận cảnh chân mày thưa cũ', action: 'Quét máy nhẹ từ ngoài vào trong chân mày thưa.', motionGuide: 'Quét máy mượt mà từ trái sang phải 3 giây.', speech: '"Chân mày thưa nhạt, trổ đỏ thế này..."' },
                    { name: 'Đoạn 2: Khuôn mặt ngậm ngùi trước làm', action: 'Zoom chậm vào góc mặt khách.', motionGuide: 'Đẩy máy tiến sát lại gần khuôn mặt 3 giây.', speech: '"...khiến chị em mất tự tin mỗi khi để mặt mộc..."' },
                    { name: 'Đoạn 3: Cận cảnh chuyên viên tự tin', action: 'Quay lướt chuyên viên mỉm cười cầm máy xăm.', motionGuide: 'Quét máy từ dưới lên trên 3 giây.', speech: '"...nhưng nay đã có bí quyết lột xác siêu đỉnh này!"' }
                ]
            },
            {
                title: 'Bước 2: Chuẩn bị & đo vẽ (12s - 4 đoạn)',
                time: '9 - 21s',
                clips: [
                    { name: 'Đoạn 1: Sát khuẩn dụng cụ sạch sẽ', action: 'Quay tay cầm bông gòn lau khay dụng cụ.', motionGuide: 'Quay dịch chuyển tay mượt mà 3 giây.', speech: '"Bước 1: Chuẩn bị dụng cụ vô trùng tuyệt đối..."' },
                    { name: 'Đoạn 2: Thoa tê êm ái', action: 'Quay thoa kem tê lên chân mày.', motionGuide: 'Quét nhẹ đầu ngón tay lướt trên mày 3 giây.', speech: '"...thoa tê êm ái không đau rát chút nào..."' },
                    { name: 'Đoạn 3: Đặt thước đo tỉ lệ vàng', action: 'Quay đặt thước đo trên cung mày.', motionGuide: 'Đưa thước đo áp sát và căn chỉnh 3 giây.', speech: '"...đo vẽ chuẩn xác tỉ lệ vàng từng khuôn mặt..."' },
                    { name: 'Đoạn 4: Khung dáng hoàn hảo', action: 'Quay cận khung dáng mày đã vẽ.', motionGuide: 'Quét chậm dọc theo đường dáng mày 3 giây.', speech: '"...tạo dáng phong thủy sang chảnh hết nấc."' }
                ]
            },
            {
                title: 'Bước 3: Thực hiện đi kim / Shading (15s - 5 đoạn)',
                time: '21 - 36s',
                clips: [
                    { name: 'Đoạn 1: Lắp kim xăm vô trùng', action: 'Quay thao tác mở hộp và lắp kim.', motionGuide: 'Quay cận cảnh tay lắp đầu kim 3 giây.', speech: '"Bước 2: Sử dụng đầu kim siêu vi điểm..."' },
                    { name: 'Đoạn 2: Đi kim rải hạt phần đuôi', action: 'Quay máy xăm đi hạt ở đuôi mày.', motionGuide: 'Di chuyển máy xăm uyển chuyển theo khung 3 giây.', speech: '"...kỹ thuật rải hạt tơi mịn tự nhiên..."' },
                    { name: 'Đoạn 3: Tạo hiệu ứng Shading đầu mày', action: 'Quay máy lướt nhẹ phần đầu mày.', motionGuide: 'Đưa máy lùi nhẹ tạo góc nhìn nghệ thuật 3 giây.', speech: '"...hiệu ứng ombre đậm nhạt hài hòa..."' },
                    { name: 'Đoạn 4: Lau bông lộ mực sắc nét', action: 'Quay dùng bông lau sạch lớp mực thừa.', motionGuide: 'Quét nhanh khăn bông lộ dáng mày cực nét 3 giây.', speech: '"...mực bám đều ngay từ lần đi kim đầu tiên..."' },
                    { name: 'Đoạn 5: Kiểm tra độ hoàn thiện', action: 'Quay rọi đèn soi kỹ từng sợi mày.', motionGuide: 'Quay lướt camera qua lại kiểm tra chi tiết 3 giây.', speech: '"...khách nằm ngủ quên lúc nào không hay."' }
                ]
            },
            {
                title: 'Bước 4: Kết quả & Chốt đơn CTA (9s - 3 đoạn)',
                time: '36 - 45s',
                clips: [
                    { name: 'Đoạn 1: Khách soi gương cười rạng rỡ', action: 'Quay khách ngắm mình trong gương.', motionGuide: 'Quét máy từ gương ra nụ cười của khách 3 giây.', speech: '"Mới làm xong mà nhẹ tênh trẻ ra cả chục tuổi!"' },
                    { name: 'Đoạn 2: Cận cảnh dáng mày bay bổng', action: 'Quay cận dáng mày hoàn thiện dưới đèn.', motionGuide: 'Quay lướt chậm sát đường sợi mày 3 giây.', speech: '"...không đóng khung cứng đơ tự nhiên vô cùng!"' },
                    { name: 'Đoạn 3: Lời mời & Địa chỉ tiệm', action: 'Quay chuyên viên vẫy tay cười chào.', motionGuide: 'Quét máy nhẹ từ mặt chuyên viên ra bảng hiệu 3 giây.', speech: '"Chị em nào chân mày thưa inbox ngay cho em nhé!"' }
                ]
            }
        ]
    },
    moi: {
        label: 'Phun / Khử Thâm Môi',
        techs: ['Collagen căng bóng', 'Khử thâm nam nữ', 'Baby Lips', 'Pha lê trong veo'],
        steps: [
            {
                title: 'Bước 1: Mở đầu Hook (9s - 3 đoạn)',
                time: '0 - 9s',
                clips: [
                    { name: 'Đoạn 1: Cận cảnh nền môi thâm xỉn', action: 'Quét máy chậm qua đôi môi thâm sậm.', motionGuide: 'Quét máy mượt mà qua đôi môi 3 giây.', speech: '"Đừng ai đi phun môi khi chưa biết bí quyết này!"' },
                    { name: 'Đoạn 2: Góc mặt buồn vì môi kém sắc', action: 'Zoom chậm vào khuôn mặt.', motionGuide: 'Đẩy máy tiến sát lại góc mặt khách 3 giây.', speech: '"...môi thâm xỉn khiến bạn già đi trước tuổi..."' },
                    { name: 'Đoạn 3: Chuyên viên tự tin giới thiệu', action: 'Quay chuyên viên giơ lọ mực hữu cơ.', motionGuide: 'Quét máy từ lọ mực ra nụ cười tự tin 3 giây.', speech: '"...hãy xem màn lột xác môi hồng hào siêu đỉnh sau đây!"' }
                ]
            },
            {
                title: 'Bước 2: Chuẩn bị & Khử thâm (12s - 4 đoạn)',
                time: '9 - 21s',
                clips: [
                    { name: 'Đoạn 1: Vô trùng dụng cụ sạch', action: 'Quay sắp xếp dụng cụ xăm.', motionGuide: 'Quay dịch chuyển tay mượt mà 3 giây.', speech: '"Bước 1: Khử trùng dụng cụ sạch sẽ tuyệt đối..."' },
                    { name: 'Đoạn 2: Ủ tê môi êm ái', action: 'Quay dán miếng ủ tê lên môi.', motionGuide: 'Quét nhẹ ngón tay vuốt miếng ủ tê 3 giây.', speech: '"...ủ tê êm ái thư giãn tuyệt vời..."' },
                    { name: 'Đoạn 3: Đi dung dịch khử gốc thâm', action: 'Quay máy đi dung dịch khử thâm.', motionGuide: 'Quay đầu kim lướt nhẹ trên nền môi 3 giây.', speech: '"...sử dụng tinh chất khử sạch gốc thâm đen..."' },
                    { name: 'Đoạn 4: Lau bông lộ nền môi sáng', action: 'Quay dùng bông lau sạch.', motionGuide: 'Quét nhanh khăn bông lộ sắc môi sáng 3 giây.', speech: '"...trả lại nền môi sạch thâm hoàn toàn."' }
                ]
            },
            {
                title: 'Bước 3: Cấy màu hữu cơ (15s - 5 đoạn)',
                time: '21 - 36s',
                clips: [
                    { name: 'Đoạn 1: Trộn màu mực hữu cơ', action: 'Quay giọt mực hòa quyện vào nhau.', motionGuide: 'Quay cận cảnh giọt mực sánh mịn 3 giây.', speech: '"Bước 2: Pha chế màu mực hữu cơ cao cấp..."' },
                    { name: 'Đoạn 2: Đi kim lướt nhẹ trên môi', action: 'Quay máy xăm đi đều trên môi.', motionGuide: 'Di chuyển máy xăm uyển chuyển theo đường môi 3 giây.', speech: '"...kỹ thuật đi kim siêu vi chạm hạt mỏng nhẹ..."' },
                    { name: 'Đoạn 3: Tản màu đều đặn', action: 'Quay máy đi màu ở lòng môi.', motionGuide: 'Đưa máy lùi nhẹ tạo góc nhìn nghệ thuật 3 giây.', speech: '"...giúp màu mực tản đều trong veo tự nhiên..."' },
                    { name: 'Đoạn 4: Lau bông lộ màu môi hồng', action: 'Quay lau bông lộ sắc môi hồng hào.', motionGuide: 'Quét nhanh khăn bông lộ màu môi rạng rỡ 3 giây.', speech: '"...màu lên trong veo chuẩn tông ngay lập tức..."' },
                    { name: 'Đoạn 5: Kiểm tra độ bóng mọng', action: 'Quay rọi đèn soi kỹ bề mặt môi.', motionGuide: 'Quay lướt camera qua lại kiểm tra chi tiết 3 giây.', speech: '"...môi mướt mịn không hề sưng nề."' }
                ]
            },
            {
                title: 'Bước 4: Kết quả & Chốt đơn CTA (9s - 3 đoạn)',
                time: '36 - 45s',
                clips: [
                    { name: 'Đoạn 1: Thoa dưỡng bóng mọng', action: 'Quay thoa thỏi son dưỡng lên môi.', motionGuide: 'Quét chậm thỏi dưỡng lướt trên môi 3 giây.', speech: '"Làm xong môi hồng hào căng mọng tức thì!"' },
                    { name: 'Đoạn 2: Khách khoe môi dưới ánh đèn', action: 'Quay cận cảnh môi bắt sáng lung linh.', motionGuide: 'Quay lướt chậm sát đôi môi bắt sáng 3 giây.', speech: '"...m mặt mộc không son vẫn rạng rỡ cả ngày!"' },
                    { name: 'Đoạn 3: Lời mời ưu đãi khử thâm', action: 'Quay chuyên viên mỉm cười vẫy tay.', motionGuide: 'Quét máy nhẹ từ mặt chuyên viên ra bảng màu 3 giây.', speech: '"Inbox ngay cho em nhận ưu đãi khử thâm tháng này nhé!"' }
                ]
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
                title: 'Bước 1: Mở đầu Hook (9s - 3 đoạn)',
                time: '0 - 9s',
                clips: [
                    { name: 'Đoạn 1: Đưa sản phẩm sát camera', action: 'Đưa ly nước tiến sát camera mượt mà.', motionGuide: 'Đưa ly nước tiến sát camera mượt mà 3 giây.', speech: (dish) => `"${dish ? dish + ' - ' : ''}Đố bạn tìm được ly nước nào thơm ngon béo ngậy như thế này!"` },
                    { name: 'Đoạn 2: Cận cảnh lớp kem / topping', action: 'Zoom sát vào lớp topping óng ánh.', motionGuide: 'Đẩy máy tiến sát vào lớp topping óng ánh 3 giây.', speech: () => `"...nhìn lớp kem béo ngậy ngập tràn thế này..."` },
                    { name: 'Đoạn 3: Biểu cảm thèm thuồng', action: 'Quét nhẹ từ ly nước lên nét mặt hóng.', motionGuide: 'Quét nhẹ từ ly nước lên nét mặt hóng chuyện 3 giây.', speech: () => `"...xem xong clip là chỉ muốn chạy ra quán mua liền!"` }
                ]
            },
            {
                title: 'Bước 2: Pha chế & Nguyên liệu (12s - 4 đoạn)',
                time: '9 - 21s',
                clips: [
                    { name: 'Đoạn 1: Rót cốt trà / Cà phê', action: 'Quay dịch chuyển tay rót mượt mà.', motionGuide: 'Quay dịch chuyển tay rót trà mượt mà 3 giây.', speech: (dish) => `"Bước 1: Chuẩn bị cốt nguyên liệu cho món ${dish || 'này'}..."` },
                    { name: 'Đoạn 2: Hòa quyện sữa / Sốt', action: 'Quét máy theo dòng chảy.', motionGuide: 'Quét máy theo dòng sữa chảy xuống 3 giây.', speech: () => `"...kết hợp sữa tươi thơm ngậy chuẩn công thức..."` },
                    { name: 'Đoạn 3: Thêm topping đầy ắp', action: 'Đưa muỗng topping vun vút vào ly.', motionGuide: 'Đưa muỗng topping vun vút vào ly 3 giây.', speech: () => `"...topping nhà làm dai giòn sần sật ngập tràn..."` },
                    { name: 'Đoạn 4: Hoàn thiện ly nước', action: 'Quét máy theo chiều cao ly.', motionGuide: 'Quét máy chậm theo chiều cao của ly nước 3 giây.', speech: () => `"...hoàn thiện siêu phẩm xinh xắn đỉnh chóp."` }
                ]
            },
            {
                title: 'Bước 3: Trải nghiệm thực tế (15s - 5 đoạn)',
                time: '21 - 36s',
                clips: [
                    { name: 'Đoạn 1: Cắm ống hút / Khuấy đều', action: 'Quay cận cảnh cắm ống hút.', motionGuide: 'Quay cận cảnh ống hút cắm ngập lớp kem 3 giây.', speech: () => `"Bước 2: Cắm ống hút khuấy đều thưởng thức..."` },
                    { name: 'Đoạn 2: Hút ngụm đầu tiên', action: 'Quay góc mặt thưởng thức thăng hoa.', motionGuide: 'Quay góc mặt thưởng thức biểu cảm thăng hoa 3 giây.', speech: (dish) => `"...vị ${dish || 'này'} thanh mát hòa quyện béo ngậy tuyệt đỉnh..."` },
                    { name: 'Đoạn 3: Tròn mắt khen ngon', action: 'Đẩy máy lại gần nét mặt ngạc nhiên.', motionGuide: 'Đẩy máy lại gần nét mặt ngạc nhiên thích thú 3 giây.', speech: () => `"...trời ơi ngon nhức nách mọi người ạ..."` },
                    { name: 'Đoạn 4: Nhai topping sần sật', action: 'Quay góc cằm nhai biểu cảm vui vẻ.', motionGuide: 'Quay góc cằm nhai biểu cảm vui vẻ 3 giây.', speech: () => `"...topping nhai vui miệng cực kỳ cuốn hút..."` },
                    { name: 'Đoạn 5: Giơ ngón cái công nhận', action: 'Quét máy từ ly ra ngón tay like.', motionGuide: 'Quét máy từ ly nước ra ngón tay cái like mạnh 3 giây.', speech: () => `"...xứng đáng 10/10 điểm không chê vào đâu được!"` }
                ]
            },
            {
                title: 'Bước 4: Hoàn thiện & CTA (9s - 3 đoạn)',
                time: '36 - 45s',
                clips: [
                    { name: 'Đoạn 1: Ly nước lung linh dưới đèn', action: 'Quét máy vòng quanh ly nước.', motionGuide: 'Quét máy vòng quanh ly nước lấp lánh 3 giây.', speech: (dish) => `"${dish || 'Món ngon'} sẵn sàng phục vụ các bác đây!"` },
                    { name: 'Đoạn 2: Không gian quán chill', action: 'Quét máy toàn cảnh quán.', motionGuide: 'Quét máy toàn cảnh quán ấm cúng 3 giây.', speech: () => `"Ghé ngay Kim Bling hoặc đặt ship liền tay nhé!"` },
                    { name: 'Đoạn 3: Vẫy tay chào', action: 'Quét máy ra vẫy tay chào.', motionGuide: 'Quét máy từ quầy bar ra vẫy tay chào 3 giây.', speech: () => `"Nhớ ghé quán em chơi nha, bye bye!"` }
                ]
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
                title: 'Bước 1: Mở đầu Hook (9s - 3 đoạn)',
                time: '0 - 9s',
                clips: [
                    { name: 'Đoạn 1: Giơ đĩa đồ ăn nóng hổi', action: 'Đưa đĩa đồ ăn tiến sát camera.', motionGuide: 'Đưa đĩa đồ ăn tiến sát camera mượt mà 3 giây.', speech: (dish) => `"${dish ? dish + ' - ' : ''}Nhìn phần ăn nóng hổi ngập sốt thế này ai mà cưỡng lại được!"` },
                    { name: 'Đoạn 2: Cận cảnh phô mai kéo sợi', action: 'Đẩy máy theo chiều kéo sợi.', motionGuide: 'Đẩy máy từ từ theo chiều kéo sợi phô mai 3 giây.', speech: () => `"...phô mai kéo sợi dẻo quánh thơm phức..."` },
                    { name: 'Đoạn 3: Biểu cảm thèm thuồng', action: 'Quét nhẹ lên nét mặt hóng.', motionGuide: 'Quét nhẹ từ đĩa đồ ăn lên nét mặt hóng chuyện 3 giây.', speech: () => `"...xem xong clip là đó bụng ngang luôn các bác ạ!"` }
                ]
            },
            {
                title: 'Bước 2: Chế biến xèo xèo (12s - 4 đoạn)',
                time: '9 - 21s',
                clips: [
                    { name: 'Đoạn 1: Đảo chảo sốt sôi sùng sục', action: 'Quay chảo bốc khói.', motionGuide: 'Quay dịch chuyển chảo thức ăn bốc khói 3 giây.', speech: (dish) => `"Bước 1: Chế biến món ${dish || 'này'} nóng hổi trên chảo sốt..."` },
                    { name: 'Đoạn 2: Rưới nước sốt thần thánh', action: 'Quét theo dòng sốt chảy.', motionGuide: 'Quét máy theo dòng sốt chảy óng ánh 3 giây.', speech: () => `"...chan hòa lớp nước sốt đậm đà cay cay ngọt ngọt..."` },
                    { name: 'Đoạn 3: Rắc topping thơm phức', action: 'Đưa tay rắc topping.', motionGuide: 'Đưa tay rắc hành phi/topping thơm xuống đĩa 3 giây.', speech: () => `"...rắc thêm topping giòn rụm thơm nức mũi..."` },
                    { name: 'Đoạn 4: Múc ra đĩa/hộp khói nghi ngút', action: 'Quay xẻng múc đồ ăn.', motionGuide: 'Quét máy theo xẻng múc đồ ăn ra đĩa 3 giây.', speech: () => `"...múc ra đĩa nóng giòn ngon nhức nách!"` }
                ]
            },
            {
                title: 'Bước 3: Trải nghiệm ăn uống (15s - 5 đoạn)',
                time: '21 - 36s',
                clips: [
                    { name: 'Đoạn 1: Chấm đẫm chén sốt', action: 'Quay cận cảnh nhúng ngập sốt.', motionGuide: 'Quay cận cảnh nhúng ngập sốt đậm đặc 3 giây.', speech: () => `"Bước 2: Chấm đẫm chén sốt thần thánh ăn là ghiền..."` },
                    { name: 'Đoạn 2: Cắn ngập răng giòn rụm', action: 'Quay góc mặt cắn ngập răng.', motionGuide: 'Quay góc mặt cắn ngập răng giòn rụm 3 giây.', speech: () => `"...bên ngoài giòn rụm bên trong mềm ngọt tuyệt đỉnh..."` },
                    { name: 'Đoạn 3: Tròn mắt khen ngon', action: 'Đẩy máy lại gần nét mặt ngạc nhiên.', motionGuide: 'Đẩy máy lại gần nét mặt ngạc nhiên thích thú 3 giây.', speech: () => `"...trời ơi đỉnh chóp thực sự mọi người ạ..."` },
                    { name: 'Đoạn 4: Húp xì xụp nước sốt', action: 'Quay góc cằm biểu cảm ăn ngon.', motionGuide: 'Quay góc cằm biểu cảm ăn uống ngon lành 3 giây.', speech: () => `"...vị cay cay tê tê kích thích vị giác cực kỳ..."` },
                    { name: 'Đoạn 5: Giơ ngón cái công nhận', action: 'Quét máy ra ngón like.', motionGuide: 'Quét máy từ đĩa đồ ăn ra ngón tay cái like mạnh 3 giây.', speech: () => `"...xứng đáng 10/10 điểm phải thử ngay nha!"` }
                ]
            },
            {
                title: 'Bước 4: Hoàn thiện & CTA (9s - 3 đoạn)',
                time: '36 - 45s',
                clips: [
                    { name: 'Đoạn 1: Đĩa đồ ăn đầy ắp', action: 'Quét máy vòng quanh đĩa ăn.', motionGuide: 'Quét máy vòng quanh đĩa đồ ăn hấp dẫn 3 giây.', speech: () => `"Một phần đầy ú ụ giá siêu hạt dẻ cho các bác đây!"` },
                    { name: 'Đoạn 2: Không gian quán tấp nập', action: 'Quét toàn cảnh quán.', motionGuide: 'Quét máy toàn cảnh quán nhộn nhịp 3 giây.', speech: () => `"Ghé ngay Kim Bling hoặc đặt ship liền tay nhé!"` },
                    { name: 'Đoạn 3: Vẫy tay chào', action: 'Quét máy vẫy tay chào.', motionGuide: 'Quét máy từ quầy bán ra vẫy tay chào 3 giây.', speech: () => `"Đặt hàng ngay bên dưới nha, bye bye!"` }
                ]
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
    }
];

const viralCaptions = [
    "Đừng ai mua/làm sản phẩm này khi chưa xem hết video! Xem xong chỉ muốn chốt đơn ngay lập tức 🤤🔥",
    "Sức hút khó cưỡng từ siêu phẩm Kim Bling đây các bác ơi! Thưởng thức một lần là ghiền, không ngon không lấy tiền ✨",
    "Tận mắt chứng kiến quá trình làm siêu phẩm này mới hiểu vì sao khách xếp hàng dài mỗi ngày 💯",
    "Hôm nay mời mọi người cùng trải nghiệm món hot hit triệu view nhà em nhé. Nhìn có kích thích không ạ? 😍",
    "Trời lạnh/nóng thế này mà có món này thì hết nước chấm! Đang có ưu đãi sốc, bấm vào giỏ hàng ngay 👇"
];

const capcutDetailedGuides = [
    {
        tabTitle: '1. Ghép Nhiều Clip',
        heading: 'Bước 1: Ghép các đoạn video ngắn 3 giây liên tục vào CapCut',
        steps: [
            { title: 'Mở app CapCut', detail: 'Bấm dấu cộng màu xanh <strong>Dự án mới (New Project)</strong> trên màn hình chính.' },
            { title: 'Chọn tất cả các clip ngắn 3s', detail: 'Chọn lần lượt từng đoạn video ngắn 3 giây bạn vừa quay (từ Bước 1 đến Bước 4) theo đúng thứ tự rồi bấm <strong>Thêm (Add)</strong>.' },
            { title: 'Khóa chuẩn khung dọc TikTok', detail: 'Vuốt thanh công cụ dưới cùng sang phải -> Bấm mục <strong>Tỷ lệ (Aspect Ratio)</strong> -> Chọn <strong>9:16</strong> (biểu tượng TikTok).' },
            { title: 'Xóa đuôi logo CapCut', detail: 'Vuốt thanh video về cuối cùng -> Bấm vào ô đen <strong>Phần kết (Ending)</strong> -> Bấm nút <strong>Xóa (Delete)</strong>.' }
        ]
    },
    {
        tabTitle: '2. Cắt & Nhịp 3s',
        heading: 'Bước 2: Cắt ngắn mỗi đoạn đúng 3 giây & Thêm chuyển cảnh dồn dập',
        steps: [
            { title: 'Cắt gọt clip ngắn gọn', detail: 'Chạm vào từng đoạn video -> Kéo hai đầu mút để độ dài mỗi đoạn chỉ từ <strong>2.5 đến 3 giây</strong> là phải chuyển sang góc khác.' },
            { title: 'Thêm chuyển cảnh giật beat', detail: 'Bấm vào ô vuông trắng nhỏ nằm giữa các đoạn clip -> Chọn hiệu ứng <strong>Chớp trắng (Flash)</strong> hoặc <strong>Trượt nhanh</strong> và kéo thời gian về <strong>0.3s</strong>.' },
            { title: 'Tạo nhịp điệu dồn dập', detail: 'Việc ghép liên tục các góc quay 3 giây giúp video cực kỳ cuốn hút, giữ chân người xem từ đầu đến cuối.' }
        ]
    },
    {
        tabTitle: '3. Lồng Tiếng',
        heading: 'Bước 3: Ghi âm lời thoại & Nhạc nền',
        steps: [
            { title: 'Tắt tiếng ồn nền', detail: 'Chạm vào các clip -> Bấm <strong>Âm lượng (Volume)</strong> -> Kéo về <strong>0</strong>.' },
            { title: 'Ghi âm lời thoại', detail: 'Bấm <strong>Âm thanh (Audio)</strong> -> Bấm <strong>Ghi âm (Record)</strong> -> Giữ nút Micro và đọc theo câu thoại trong app này.' },
            { title: 'Thêm nhạc nền nhỏ', detail: 'Vào <strong>Âm thanh</strong> -> Chọn nhạc hot trend -> Giảm âm lượng nhạc nền xuống <strong>10% - 15%</strong> để nghe rõ lời thoại.' }
        ]
    },
    {
        tabTitle: '4. Chữ & Màu',
        heading: 'Bước 4: Phụ đề tự động & Chỉnh màu sắc nét',
        steps: [
            { title: 'Tạo phụ đề 1 chạm', detail: 'Bấm <strong>Văn bản (Text)</strong> -> Chọn <strong>Phụ đề tự động</strong> -> Ngôn ngữ <strong>Tiếng Việt</strong> -> Bấm <strong>Tạo</strong>.' },
            { title: 'Chọn kiểu chữ đẹp', detail: 'Bấm vào chữ -> Chọn <strong>Phong cách</strong> -> Chọn mẫu <strong>Chữ trắng viền đen</strong> nổi bật.' },
            { title: 'Chỉnh màu tươi tắn', detail: 'Chạm vào clip -> Bấm <strong>Bộ lọc (Filters)</strong> -> Chọn <strong>Ẩm thực</strong> hoặc <strong>Chân dung</strong> mức 35%.' }
        ]
    },
    {
        tabTitle: '5. Xuất File',
        heading: 'Bước 5: Xuất video sắc nét đăng TikTok',
        steps: [
            { title: 'Chỉnh độ phân giải', detail: 'Bấm vào chữ <strong>1080P</strong> ở góc trên bên phải màn hình CapCut.' },
            { title: 'Cài đặt thông số chuẩn', detail: 'Chọn Độ phân giải <strong>1080P</strong> | Khung hình <strong>60fps</strong> | Tốc độ mã <strong>Khuyến nghị</strong>.' },
            { title: 'Xuất video', detail: 'Bấm mũi tên xuất file -> Video tự lưu vào Ảnh iPhone và sẵn sàng đăng TikTok!' }
        ]
    }
];
