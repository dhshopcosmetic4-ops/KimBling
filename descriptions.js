const descriptionsMap = {
    // --- NHÓM MATCHA ---
    "matcha latte": "Matcha Uji đậm vị quyện sữa tươi béo ngậy, thanh mát dịu nhẹ tan ngay đầu lưỡi.",
    "matcha bac ha": "Sự kết hợp hoàn hảo giữa matcha đậm đà và bạc hà mát lạnh, đập tan cái nóng tức thì.",
    "matcha ca phe": "Vị đắng thanh của matcha hòa quyện cùng cà phê nguyên chất, thức tỉnh năng lượng cả ngày.",
    "matcha dâu": "Matcha thơm dịu hòa cùng vị dâu tây chua ngọt mọng nước, béo mịn xinh xắn.",
    "matcha oreo": "Matcha đậm vị kết hợp bánh Oreo giòn rụm béo béo, nhai vui miệng không thể dừng.",
    "matcha chuoi": "Matcha đắng nhẹ quyện nhịp cùng chuối thơm ngọt tự nhiên, lạ miệng béo ngậy.",
    "matcha socola oreo": "Sự bùng nổ vị giác từ matcha, socola đậm đặc và vụn Oreo giòn tan béo ngậy.",
    "matcha việt quất": "Matcha thanh mát quyện sốt việt quất chua ngọt mọng nước độc lạ cuốn hút.",
    "matcha yến mạch": "Matcha Uji đậm đà quyện sữa yến mạch bùi thơm tốt cho sức khỏe.",
    "matcha latte kem machiato": "Matcha thơm béo ngập tràn lớp kem machiato mằn mặn béo ngậy sánh mịn.",

    // --- NHÓM TRÀ SỮA & TRÀ TRÁI CÂY ĐẶC BIỆT ---
    "trà nho xanh mẫu đơn": "Hương vị siêu phẩm thơm mát vị nho xanh mẫu đơn thượng hạng, ngọt thanh giòn giòn cực đã.",
    "trà sữa ô long lài": "Trà ô long lài thơm ngát đặc trưng quyện trân châu đen dẻo dai béo ngậy.",
    "trà sữa truyền thống": "Trà sữa béo thơm chuẩn vị truyền thống, ngọt thanh dễ chịu kèm trân châu dai giòn.",
    "trà sữa socola": "Trà sữa béo ngậy hòa quyện socola nguyên chất đậm đặc, thơm nức mũi.",
    "trà sữa yến mạch": "Trà sữa béo mịn kết hợp hạt yến mạch bùi bùi thơm ngon, bổ dưỡng khó cưỡng.",
    "trà sữa khoai môn": "Vị khoai môn béo bùi đặc trưng đượm trong từng ngụm trà sữa ngọt ngào.",
    "trà sữa matcha": "Trà xanh thanh mát đan xen lớp sữa béo mịn màng, đậm đà chuẩn gu ghiền.",
    "trà sữa than tre": "Sắc đen huyền bí, vị trà thanh dịu kết hợp độ béo nhẹ thanh lọc cơ thể cực đỉnh.",
    "khoai môn latte kem": "Khoai môn bùi béo phủ lớp kem béo ngậy sánh mịn ngọt ngào ngất ngây.",
    "hồng trà tắc": "Hồng trà đậm đà đượm vị tắc tươi chua ngọt, giải khát cực nhanh.",
    "trà tắc thái": "Trà Thái thơm đặc trưng hòa vị tắc tươi chua dịu, giải khát tức thì.",
    "hồng trà xí muội": "Hồng trà kết hợp xí muội mặn ngọt chua thanh kích thích vị giác cực mạnh.",
    "hồng trà dâu": "Hồng trà đậm vị thơm ngát hương dâu tây tươi mọng chua ngọt sảng khoái.",
    "hồng trà đào": "Hồng trà thơm đậm kết hợp những miếng đào giòn ngọt đập tan cơn khát.",
    "hồng trà xoài": "Hồng trà thơm lừng đượm vị xoài chín ngọt mát đỉnh cao.",
    "hồng trà dưa lưới": "Hồng trà thanh mát thơm ngát hương dưa lưới ngọt lịm lịm tim.",
    "hồng trà việt quất": "Hồng trà đậm đà quyện vị việt quất chua ngọt mọng nước.",
    "hồng trà vải": "Hồng trà thanh tao thoảng hương vải thiều ngọt ngào mọng nước.",
    "hồng trà ổi": "Hồng trà thơm đậm quyện vị ổi hồng giòn ngọt độc lạ.",
    "hồng trà mãng cầu": "Hồng trà kết hợp mãng cầu xiêm chua ngọt thơm lừng tê tái.",
    "hồng trà dâu tầm": "Hồng trà đượm vị dâu tầm chua ngọt đậm đà kích thích vị giác.",
    "hồng trà chanh dây": "Hồng trà chanh dây chua ngọt thanh mát, nạp lại năng lượng tức thì.",
    "hồng trà me": "Hồng trà me chua ngọt đậm đà kèm đậu phộng bùi bùi ăn là ghiền.",

    // --- NHÓM CÀ PHÊ & CACAO ---
    "cà phê đen đá": "Cà phê phin Trung Nguyên đậm đà nguyên bản, đắng thanh bừng tỉnh tinh thần.",
    "cà phê sữa đá": "Hương cà phê rang xay đậm đặc hòa quyện sữa đặc ngọt béo sảng khoái bất tận.",
    "cà phê muối": "Cà phê đắng đậm phủ lớp kem muối mặn mặn béo ngậy đánh thức mọi giác quan.",
    "bạc sỉu đá": "Nền sữa tươi ngọt ngào thơm thoảng vị cà phê nhẹ nhàng, êm dịu dễ nghiện.",
    "cà phê trứng sữa": "Lớp kem trứng vàng sánh mịn, đánh bông béo ngậy ngập tràn trên nền cà phê đậm đà.",
    "cà phê bọt biển": "Bọt cà phê Dalgona bồng bềnh mịn màng trên ly sữa tươi mát lạnh cực chill.",
    "cà phê pha máy": "Espresso chiết xuất chuẩn máy thơm nồng nàn, đậm vị nguyên bản từng giọt.",
    "cà phê sữa pha máy": "Cà phê máy đậm đặc hòa quyện sữa đặc sánh mịn, ngọt ngào thơm phức.",
    "cà phê sữa caramel": "Cà phê thơm lừng tưới đẫm sốt caramel ngọt ngào, quyến rũ trong từng ngụm.",
    "cà phê yến mạch": "Cà phê đậm vị kết hợp sữa yến mạch thơm bùi dinh dưỡng, healthy khó cưỡng.",
    "cà phê sữa chuối": "Sự kết hợp độc lạ giữa cà phê đậm đà và hương chuối thơm ngọt béo mịn.",
    "cacao latte": "Cacao nguyên chất đậm đặc sánh mịn cùng sữa tươi, ấm áp ngọt ngào.",
    "cacao phô mai sữa": "Cacao đắng dịu quyện lớp phô mai béo ngậy mặn mặn tan chảy trong lồng ngực.",
    "cacao chuối": "Hương cacao đậm đà thơm lừng vị chuối chín ngọt tự nhiên, béo mịn lạ miệng.",
    "cacao oreo": "Cacao đậm đặc kết hợp Oreo giòn rụm tan chảy béo ngậy siêu bánh cuốn.",
    "cacao bạc hà": "Cacao đậm vị điểm xuyết hương bạc hà the mát sảng khoái đến tận tim.",
    "cacao latte kem machiato": "Cacao đậm đặc phủ lớp kem machiato béo ngậy mằn mặn siêu hấp dẫn.",
    "cafe mật ong": "Cà phê đậm đà hòa quyện vị ngọt thanh tự nhiên từ mật ong nguyên chất.",

    // --- NHÓM HOA ANH ĐÀO & SODA ---
    "hoa anh đào": "Hương hoa anh đào ngọt ngào lãng mạn kết hợp kem béo hoặc sốt trái cây mọng nước.",
    "hoa anh đào oreo": "Hương anh đào thơm ngọt quyện vụn bánh Oreo giòn rụm béo béo độc lạ.",
    "soda việt quất": "Soda nổ bọt mát lạnh chua ngọt vị việt quất tươi mọng cùng thạch dẻo dai.",
    "soda dâu": "Soda trái cây gas nhẹ ngập tràn hương dâu tây ngọt ngào và thạch giòn sần sật.",
    "soda bạc hà": "Đập tan cơn khát với soda bạc hà siêu the mát cùng thạch dẻo giòn cực đã.",
    "soda đào": "Soda đào thơm ngọt lịm kết hợp thạch trái cây dai giòn sảng khoái tột đỉnh.",
    "soda xoài": "Vị xoài chín mọng ngọt mát trong từng ngụm soda nổ bọt vui miệng.",
    "soda ổi": "Hương ổi hồng thơm lừng đặc trưng quyện soda mát lạnh và thạch giòn.",
    "soda mãng cầu": "Mãng cầu chua chua ngọt ngọt độc lạ, giải nhiệt cực mạnh ngày nắng.",

    // --- NHÓM LY 1 LÍT KHỔNG LỒ & ĐỒ UỐNG KHÁC ---
    "ly 1 lít bí đao": "Trà bí đao ngọt thanh mát lạnh ly khổng lồ 1 Lít uống ngập ngụa đã cái nết.",
    "ly 1 lít hoa cúc": "Trà hoa cúc thanh dịu ngọt mát, giải nhiệt thanh lọc cơ thể dung tích siêu to.",
    "ly 1 lít rong biển": "Rong biển sương sáo hạt chia thanh mát, giải nhiệt độc đáo ly 1 lít sảng khoái.",
    "ly 1 lít trà tắc": "Trà tắc chua ngọt sảng khoái đập tan khát khô cổ họng dung tích 1 lít khổng lồ.",
    "trà đá đường": "Trà đá đường ngọt mát bình dân, giải khát nhanh chóng tức thì.",
    "milo dầm": "Milo đậm đặc dầm đá mát lạnh ngập tràn sốt béo ngậy và topping giòn rụm.",
    "khoai môn": "Khoai môn bùi béo tự nhiên quyện sữa tươi mềm mịn ngọt dịu ngất ngây.",
    "sâm dứa sữa": "Hương sâm dứa thơm lừng quen thuộc quyện sữa ngậy mát lạnh lịm tim.",
    "sữa tươi trân châu đường đen": "Trân châu đường đen dẻo ấm ngọt lịm rót quanh ly sữa tươi thanh mát.",
    "oreo latte": "Sữa tươi latte thơm béo kết hợp vụn bánh Oreo giòn tan béo ngậy.",
    "việt quất latte": "Vị việt quất chua ngọt mọng nước hòa quyện sữa tươi béo mịn màng.",
    "dâu latte": "Dâu tây tươi mọng ngọt ngào quyện cùng sữa tươi béo ngậy xinh xắn.",
    "đào latte": "Đào thơm ngọt thanh mát quyện lớp sữa tươi mềm mịn cực chill.",
    "xoài latte": "Xoài chín vàng ngọt lịm thơm phức quyện sữa tươi béo ngậy.",
    "sữa dừa sương sáo": "Nước cốt dừa thơm béo ngậy quyện sương sáo thanh mát giòn dai sần sật.",
    "đá me": "Đá me chua ngọt mát lạnh lịm tim, thêm đậu phộng bùi bùi và hạt đát dẻo dai.",
    "hojicha latte": "Trà xanh nướng Hojicha thơm mùi khói đặc trưng quyện sữa tươi béo dịu.",
    "socola chuối oreo": "Sự kết hợp đỉnh cao giữa socola đậm đặc, chuối thơm và Oreo giòn béo.",
    "sữa tuyết": "Thức uống xay mịn màng mát lạnh ngập tràn vị trái cây và kem béo ngậy thượng hạng.",
    "lipton latte": "Trà Lipton đậm đà quen thuộc quyện lớp sữa tươi béo ngậy thơm ngon khó cưỡng.",
    "bánh flan": "Bánh flan béo ngậy thơm mùi trứng sữa chan sốt cà phê đắng thanh cực đỉnh.",

    // --- NHÓM SỮA CHUA KHỔNG LỒ & TRUYỀN THỐNG ---
    "sữa chua kem": "Sữa chua sánh mịn chua ngọt mát lạnh phủ lớp kem béo ngậy.",
    "sữa chua phô mai": "Sữa chua lên men sánh mịn hòa quyện phô mai béo ngậy tan chảy trong miệng.",
    "sữa chua việt quất": "Sữa chua việt quất chua ngọt mọng nước mát lạnh ly khổng lồ 1 lít sảng khoái.",
    "sữa chua dâu tây": "Sữa chua dâu tây kết hợp Oreo giòn rụm béo béo chua ngọt ly 1 lít siêu cuốn.",
    "sữa chua đào": "Sữa chua đào thơm ngọt thanh mát ly khổng lồ 1 lít ăn hoài không ngán.",
    "sữa chua xoài": "Sữa chua xoài chín mọng ngọt lịm thơm mát ly 1 lít đã thèm.",
    "sữa chua ổi hồng": "Sữa chua ổi hồng thơm lừng độc lạ chua ngọt mát lạnh ly 1 lít.",
    "sữa chua chuối": "Sữa chua chuối béo ngậy thơm ngọt tự nhiên ly 1 lít dinh dưỡng.",
    "sữa chua dưa lưới": "Sữa chua dưa lưới ngọt mát thơm lừng giải nhiệt cực mạnh ly 1 lít.",
    "sữa chua cà phê": "Sữa chua chua dịu kết hợp chút đắng nhẹ của cà phê lạ miệng khó quên.",
    "sữa chua matcha": "Sữa chua sánh mịn kết hợp vị matcha thơm thanh độc đáo.",

    // --- NHÓM ĐỒ ĂN VẶT & MÓN NÓNG, CÁNH GÀ BBQ ---
    "chân gà": "Chân gà rút xương giòn sần sật đẫm sốt Thái chua cay mặn ngọt đậm đà kích thích.",
    "lạp xưởng": "Lạp xưởng tươi nướng đá thơm nức mũi, thịt mọng nước nóng hổi cắn ngập răng.",
    "sứa sốt thái": "Sứa tươi sần sật trộn sốt Thái chua cay đậm đà chuẩn vị lai rai nhức nách.",
    "cá viên": "Cá viên chiên vàng giòn rụm thơm phức, chấm tương đậm đà ăn hoài không ngán.",
    "sốt phô mai": "Đẫm ngập sốt phô mai béo ngậy vàng óng kéo sợi thơm phức.",
    "sốt mắm tỏi": "Phủ đầy sốt mắm tỏi phi thơm lừng đậm đà mặn ngọt cực kỳ đưa miệng.",
    "sốt trứng muối": "Sốt trứng muối béo ngậy vàng ươm mặn mặn bùi bùi phủ kín món ăn.",
    "tokbokki": "Bánh gạo Hàn Quốc dẻo mềm đẫm sốt cay nồng và phô mai kéo sợi ngậy béo.",
    "bánh gạo tokbokki nướng": "Bánh gạo nướng vỏ giòn tan chấm kèm sốt phô mai sữa béo ngậy thơm lừng.",
    "bánh tráng": "Mẹt bánh tráng dẻo thơm đủ vị chấm kèm sốt bơ me chua cay đậm đà ăn là nghiện.",
    "cơm chiên": "Cơm chiên hạt vàng giòn tơi xốp đậm đà gia vị thơm ngon ấm bụng.",
    "gỏi đu đủ": "Đu đủ bào giòn sần sật trộn khô bò đen Tây Ninh đậm đà, nước sốt chua ngọt chuẩn vị.",
    "mì sườn ức gà": "Tô mì nóng hổi topping sườn ức gà mềm thơm đẫm sốt phô mai cay nồng siêu đã.",
    "mì sườn cánh gà bbq": "Mì nóng hổi kết hợp cánh gà BBQ đẫm sốt đậm đà phô mai cay kích thích vị giác.",
    "mì tương đen": "Mì trộn sốt tương đen Hàn Quốc đậm đà chuẩn vị, óng ánh thơm phức.",
    "mì trộn": "Mì trộn đậm vị sốt đặc biệt ăn kèm topping ngập tràn giòn dai no căng bụng.",
    "cánh gà bbq": "Cánh gà chiên giòn rụm áo lớp sốt BBQ đậm đà, thơm lừng mặn ngọt siêu cuốn.",
    "bột chiên cánh gà bbq": "Cánh gà tẩm bột chiên giòn rụm đẫm sốt BBQ và phô mai béo ngậy thơm phức."
};

function getItemDescription(name) {
    if (!name) return "Thức uống thơm ngon đậm đà từ Kim Bling Coffee & Tea.";
    const nameNorm = typeof removeDiacritics === 'function' ? removeDiacritics(name) : name.toLowerCase();
    
    for (let key in descriptionsMap) {
        if (nameNorm.includes(key)) return descriptionsMap[key];
    }
    
    if (nameNorm.includes('tac')) return "Vị trà đậm đà kết hợp tắc tươi chua ngọt thanh mát, giải nhiệt cực đã.";
    if (nameNorm.includes('matcha')) return "Trà xanh Uji thơm thanh quyện cùng sữa béo dịu mát từng ngụm.";
    if (nameNorm.includes('ca phe') || nameNorm.includes('cafe')) return "Đậm đà hương vị cà phê nguyên chất, thơm nức lòng chuẩn gu.";
    if (nameNorm.includes('tra sua')) return "Trà sữa béo thơm đậm vị trà, ngọt thanh dễ chịu kèm topping hấp dẫn.";
    if (nameNorm.includes('sua chua')) return "Sữa chua lên men tự nhiên chua ngọt sánh mịn mát lịm tim.";
    if (nameNorm.includes('soda')) return "Soda nổ bọt mát lạnh sảng khoái kết hợp hương trái cây thơm ngọt.";
    if (nameNorm.includes('hong tra')) return "Hồng trà thơm đậm vị kết hợp trái cây tươi chua ngọt đập tan cơn khát.";
    if (nameNorm.includes('nuong') || nameNorm.includes('chien') || nameNorm.includes('an vat') || nameNorm.includes('ga')) return "Món ăn vặt thơm ngon nóng hổi, giòn rụm đậm đà chuẩn vị Kim Bling.";
    
    return "Thức uống thơm ngon đậm đà, mang lại cảm giác sảng khoái tức thì.";
}
