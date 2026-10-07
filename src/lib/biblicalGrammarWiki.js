// src/lib/biblicalGrammarWiki.js
// =====================================================================
// 🏛️ [성경 66권 원어 형태론·통사론 대백과 마스터 코퍼스 (UNABRIDGED)]
// =====================================================================

export const GRAMMAR_ENCYCLOPEDIA = {
  // ===================================================================
  // [A] 구약 히브리어 명사론 및 품사 체계 (Nominal & Parts of Speech)
  // ===================================================================
  "hebrew_pos_noun": {
    id: "hebrew_pos_noun",
    token: "명사 (Noun)",
    originalTerm: "Substantive (명사, 태그: subs)",
    lang: "히브리어",
    category: "히브리어 형태론 / 품사",
    summary: "사물, 인물, 공간, 혹은 영적 실체의 고유한 본질과 정체성을 지칭하는 자립 실사",
    mechanics: "히브리어 명사는 3자음 어근(Triconsonantal Root)에 모음 패턴과 전치/후치 접사가 결합하여 생성되며, 성(남/여)과 수(단/쌍/복), 상태(절대/연계)에 따라 굴절합니다.",
    syntax: "문장 내에서 주어, 직접 목적어, 동격어, 혹은 전치사의 목적어로 기능하며 담화의 핵심 의미론적 주체를 규정합니다.",
    theology: "성경에서 명사의 명명(Naming)은 단순한 기호 붙이기가 아니라 창조주의 주권 아래 대상의 본질과 사명을 규정하는 신적 행위입니다(창 2:19).",
    canonicalCases: [
      { ref: "창세기 1:1", text: "엘로힘 (하나님)", note: "삼위일체의 장엄 복수 명사로 참 창조주의 절대성 선포" },
      { ref: "출애굽기 3:14", text: "에흐예 (스스로 있는 자)", note: "동사적 어근에서 발현된 자존하시는 하나님의 실체" }
    ]
  },
  "hebrew_pos_proper_noun": {
    id: "hebrew_pos_proper_noun",
    token: "고유명사 (Proper Noun)",
    originalTerm: "Proper Noun (고유명사, 태그: nmpr)",
    lang: "히브리어",
    category: "히브리어 형태론 / 품사",
    summary: "특정한 인물, 지명, 민족, 신적 칭호를 특정하여 유일한 역사적 실재로 지칭하는 명사",
    mechanics: "형태론적으로 관사(הַ)를 취하지 않아도 이미 그 자체로 완전한 한정성(Definiteness)을 내포하며, 연계형 굴절을 겪지 않는 것이 원칙입니다.",
    syntax: "구속사의 시공간적 현장과 인물들을 실증적 역사로 확정하며, 언약 관계의 당사자를 배타적으로 특정합니다.",
    theology: "여호와(יהוה), 아브라함, 시온 등 고유명사의 등장은 신화적 허구가 아닌 시공간 속에서 구체적으로 성취되는 하나님의 언약적 개입을 확증합니다.",
    canonicalCases: [
      { ref: "출애굽기 6:3", text: "여호와 (יהוה)", note: "언약 백성을 구원하시는 구속주의 영원한 기념 칭호" },
      { ref: "창세기 17:5", text: "아브라함 (열국의 아비)", note: "언약 갱신과 함께 이름의 본질을 바꾸신 주권적 재명명" }
    ]
  },
  "hebrew_pos_adj": {
    id: "hebrew_pos_adj",
    token: "형용사 (Adjective)",
    originalTerm: "Adjective (형용사, 태그: adjv)",
    lang: "히브리어",
    category: "히브리어 형태론 / 품사",
    summary: "수식하는 명사의 성, 수, 한정성에 일치하여 그 본질적 성품이나 상태를 한정·서술하는 품사",
    mechanics: "수식 대상 명사의 성(남/여), 수(단/복), 한정성(관사 유무)과 100% 일치(Concord)하여 굴절합니다.",
    syntax: "한정적 용법(명사 뒤에 관사를 동반하여 뒤따름)과 서술적 용법(관사 없이 주어 명사의 상태를 선언)으로 나뉩니다.",
    theology: "'거룩한(카도쉬)', '의로운(차디크)' 등의 형용사는 하나님의 불변하시는 속성과 언약 백성이 본받아야 할 거룩의 기준을 구체화합니다.",
    canonicalCases: [
      { ref: "이사야 6:3", text: "카도쉬 카도쉬 카도쉬 (거룩하다...)", note: "하나님의 절대 거룩성을 3중 반복으로 극대화" },
      { ref: "시편 119:137", text: "차디크 아타 여호와 (여호와여 주는 의로우시니)", note: "하나님의 본질적 공의를 서술적으로 선포" }
    ]
  },
  "hebrew_pos_prep": {
    id: "hebrew_pos_prep",
    token: "전치사 (Preposition)",
    originalTerm: "Preposition (전치사, 태그: prep)",
    lang: "히브리어",
    category: "히브리어 통사론 / 불변사",
    summary: "명사구 앞에 놓여 공간적·시간적 위치, 원인, 목적, 수단, 혹은 영적 귀속 관계를 지배하는 매개어",
    mechanics: "단독 자립 전치사(민, 알, 엘 등)와 명사 앞에 접두사 형태로 밀착되는 불가분 전치사(베, 카, 라 등)로 나뉩니다.",
    syntax: "후속 명사를 통사적으로 지배하여 부사구 혹은 전치사구를 형성하며, 문장 간의 논리적 결속을 완성합니다.",
    theology: "전치사는 하나님의 섭리가 시공간 속에서 어떻게 작동하는지를 한정합니다. '주 안에서', '은혜로 말미암아'처럼 구원의 통로와 영역을 결정합니다.",
    canonicalCases: [
      { ref: "창세기 1:1", text: "베- (בְּ, ~안에, ~로)", note: "태초라는 시간적 절대 영역과 하나님의 창조 사역을 결속" },
      { ref: "시편 23:3", text: "레- (לְ, ~을 위하여)", note: "자기 이름을 위하여 의의 길로 인도하시는 목적성 천명" }
    ]
  },
  "hebrew_pos_conj": {
    id: "hebrew_pos_conj",
    token: "접속사 (Conjunction)",
    originalTerm: "Conjunction (접속사, 태그: conj)",
    lang: "히브리어",
    category: "히브리어 통사론 / 불변사",
    summary: "단어와 단어, 절과 절을 연결하여 논리적 인과율, 시간적 연속, 혹은 대조를 생성하는 결합 불변사",
    mechanics: "가장 대표적인 접속사 와우(וְ)는 후속 자음의 모음에 따라 바(וַ), 비(וִי), 우(וּ) 등으로 음운 변화를 겪으며 명사나 동사 두부에 밀착합니다.",
    syntax: "단순 병렬(and)을 넘어 역접(but), 결과(so that), 설명(that is)의 복합적 통사 담화를 전개합니다.",
    theology: "구속사에서 절과 절의 접속은 개별 사건의 분절이 아니라, 창조부터 종말까지 하나님의 언약 경륜이 하나의 거대한 구원의 흐름으로 이어져 있음을 보여줍니다.",
    canonicalCases: [
      { ref: "창세기 1:2", text: "웨-하아레츠 (그런데 그 땅은)", note: "창조의 배경 상태를 주시하도록 시선을 전환하는 접속" },
      { ref: "출애굽기 1:1", text: "웨-엘레 쉐모트 (그리고 이것이 이름들이니)", note: "창세기 구속사의 흐름을 출애굽기로 직결하는 언약적 결속" }
    ]
  },
  "hebrew_pos_art": {
    id: "hebrew_pos_art",
    token: "정관사 (Definite Article)",
    originalTerm: "Article (정관사, 태그: art)",
    lang: "히브리어",
    category: "히브리어 형태론 / 결정성",
    summary: "명사 두부에 결합하여 대상을 청자와 화자 사이에서 이미 알려진 특정한 실체로 지목하는 한정사",
    mechanics: "접두사 '헤(הַ)'와 함께 후속 자음에 중복점(Dagesh Forte)을 찍어 음운을 강화하며, 후두음 앞에서는 모음이 보상 장음화(ָה)됩니다.",
    syntax: "부정(Indefinite) 상태의 일반 명사를 유일무이한 특정 실체(Definite)로 전환시킵니다.",
    theology: "우상들의 '신들(엘로힘)'과 구별되는 '바로 그 유일하신 참 하나님(하-엘로힘)'을 표기할 때 사용되어 유일신 신앙의 절대성을 드러냅니다.",
    canonicalCases: [
      { ref: "창세기 1:1", text: "하-샤마이임 (그 하늘들)", note: "막연한 공간이 아닌 하나님의 질서가 세워진 바로 그 우주" },
      { ref: "열왕기상 18:39", text: "여호와 후 하-엘로힘 (여호와 그는 참 하나님이시로다)", note: "바알과 대조되는 유일한 참 하나님 선포" }
    ]
  },
  "hebrew_pos_prps": {
    id: "hebrew_pos_prps",
    token: "인칭대명사 (Personal Pronoun)",
    originalTerm: "Personal Pronoun (인칭대명사, 태그: prps)",
    lang: "히브리어",
    category: "히브리어 대명사론",
    summary: "화자(1인칭), 청자(2인칭), 지시대상(3인칭)을 인격적으로 대리하며 주어의 전인격성을 표출하는 품사",
    mechanics: "독립 인칭대명사(아니, 아타, 후 등)로 자립하거나, 동사/명사 뒤에 붙는 접미인칭대명사 형태로 쓰입니다.",
    syntax: "히브리어 동사는 이미 인칭 접미사를 품고 있으므로, 독립 대명사가 동사와 함께 쓰이면 주어의 극적인 강조(Emphatic Subject)를 뜻합니다.",
    theology: "'내가 곧 그니라(아니 후)', '내가 너와 함께 하리라'처럼 하나님의 자기 계시와 구속적 현존을 선언할 때 주어의 절대적 권위를 드러냅니다.",
    canonicalCases: [
      { ref: "이사야 43:10", text: "아니 후 (내가 그니라)", note: "영원부터 자존하시는 유일하신 하나님의 자기 선포" },
      { ref: "시편 23:4", text: "키 아타 임마디 (주께서 나와 함께 하심이라)", note: "친밀한 언약적 동행에 대한 전인격적 신뢰" }
    ]
  },
  "hebrew_pos_prde": {
    id: "hebrew_pos_prde",
    token: "지시대명사 (Demonstrative Pronoun)",
    originalTerm: "Demonstrative Pronoun (지시대명사, 태그: prde)",
    lang: "히브리어",
    category: "히브리어 대명사론",
    summary: "공간적, 시간적, 혹은 문맥적으로 가까운 대상(근칭: 이것)이나 먼 대상(원칭: 저것)을 명확히 가리키는 대명사",
    mechanics: "근칭 남성 단수 '제(זֶה)', 여성 '조트(זֹאת)', 복수 '엘레(אֵלֶּה)' 등으로 굴절합니다.",
    syntax: "명사를 직접 수식하는 한정사(관사 동반)로 쓰이거나, '이것이 ~이다'라는 독립 주어로 기능합니다.",
    theology: "하나님의 역사적 심판이나 언약적 징표를 눈앞에 실재하는 역사적 사실로 똑똑히 목격하도록 촉구할 때 쓰입니다.",
    canonicalCases: [
      { ref: "창세기 28:17", text: "에인 제 키 임... (이것은 다름 아닌 하나님의 집이요)", note: "벧엘에서 하나님의 임재를 현장 목격한 야곱의 고백" },
      { ref: "출애굽기 12:42", text: "라일라 제 (이 밤은 여호와의 밤이니)", note: "구속사의 전환점이 되는 유월절 밤의 역사성 한정" }
    ]
  },

  // ===================================================================
  // [B] 구약 히브리어 성(Gender)과 수(Number)
  // ===================================================================
  "hebrew_gender_m": {
    id: "hebrew_gender_m",
    token: "남성 (Masculine)",
    originalTerm: "Masculine Gender (남성, 태그: m)",
    lang: "히브리어",
    category: "히브리어 형태론 / 성 체계",
    summary: "문법적으로 남성 범주에 속하는 기본 어간 형태로, 특별한 여성화 접미사가 붙지 않은 무표지(Unmarked) 형태",
    mechanics: "어미에 여성 표지(ָה, ת)가 없는 기본형이며, 복수 굴절 시 '-임(ִים)' 어미를 취합니다.",
    syntax: "문장 내에서 동사, 형용사, 대명사의 남성 굴절 일치를 지배합니다.",
    theology: "성경에서 하나님의 사역은 남성형 동사와 대명사로 계시되어, 언약의 머리되심과 왕적 주권, 아버지 되심의 영적 권위를 질서 있게 드러냅니다.",
    canonicalCases: [
      { ref: "시편 103:13", text: "아브 (아버지)", note: "자식을 긍휼히 여기는 아버지로서의 신적 긍휼 묘사" }
    ]
  },
  "hebrew_gender_f": {
    id: "hebrew_gender_f",
    token: "여성 (Feminine)",
    originalTerm: "Feminine Gender (여성, 태그: f)",
    lang: "히브리어",
    category: "히브리어 형태론 / 성 체계",
    summary: "생물학적 여성뿐 아니라 도시, 민족 집단, 신체 기관, 영적 품음을 상징하는 명사 형태",
    mechanics: "단수 어미에 카메츠-헤(ָה)나 타우(ת)를 부착하여 표지되며, 복수형에서는 '-오트(וֹת)' 어미를 취합니다.",
    syntax: "일치하는 동사 및 형용사 역시 여성 굴절 어미를 엄격히 따라야 합니다.",
    theology: "지혜(호크마), 영(루아흐, 흔히 여성 취급), 교회와 이스라엘의 신부 됨 등 하나님의 섬세한 양육과 언약적 순결을 표현할 때 핵심적으로 사용됩니다.",
    canonicalCases: [
      { ref: "잠언 9:1", text: "호크모트 (지혜가 그의 집을 짓고)", note: "생명을 살리는 하나님의 지혜를 인격화하여 묘사" },
      { ref: "창세기 1:2", text: "루아흐 엘로힘 (하나님의 영)", note: "생명을 품으시는 성령의 보호적 역사를 여성 문법 범주로 연계" }
    ]
  },
  "hebrew_gender_c": {
    id: "hebrew_gender_c",
    token: "공성 (Common Gender)",
    originalTerm: "Common Gender (공성, 태그: c / u)",
    lang: "히브리어",
    category: "히브리어 형태론 / 성 체계",
    summary: "남성과 여성의 구별 없이 1인칭 대명사나 특정 명사에서 양성을 포괄하는 문법 형태",
    mechanics: "1인칭 단수 대명사 '아니(나)', 1인칭 복수 '아나흐누(우리)'처럼 성별 구분이 없는 통합형입니다.",
    syntax: "화자의 성별과 관계없이 모든 신자가 차별 없이 하나님의 언약적 대상이 됨을 통사론적으로 보증합니다.",
    theology: "하나님 앞에서의 회개와 구원은 성별의 구분을 초월하여 그리스도 안에서 모든 인류가 동등한 은혜의 수혜자임을 증명합니다.",
    canonicalCases: [
      { ref: "시편 23:1", text: "로 에흐사르 (내가 부족함이 없으리로다)", note: "모든 성도가 고백하는 1인칭 공성의 절대적 확신" }
    ]
  },
  "hebrew_number_sg": {
    id: "hebrew_number_sg",
    token: "단수 (Singular)",
    originalTerm: "Singular Number (단수, 태그: sg)",
    lang: "히브리어",
    category: "히브리어 수 체계 (Number)",
    summary: "단 하나의 개체, 유일한 인격, 혹은 분할되지 않는 전체성을 지칭하는 기본 수 형태",
    mechanics: "추가 복수 접미사가 부착되지 않은 본래적 어간입니다.",
    syntax: "단수 주어는 단수 동사와 일치하여 사건의 유일한 책임 주체를 확정합니다.",
    theology: "쉐마 이스라엘의 '여호와는 오직 한 분(에하드, 단수)' 선언처럼 하나님의 배타적 유일성을 증언하는 기초 문법입니다.",
    canonicalCases: [
      { ref: "신명기 6:4", text: "여호와 에하드 (여호와는 오직 하나이시니)", note: "유일신 신앙의 절대적 교리 토대" }
    ]
  },
  "hebrew_number_pl": {
    id: "hebrew_number_pl",
    token: "복수 (Plural)",
    originalTerm: "Plural Number (복수, 태그: pl)",
    lang: "히브리어",
    category: "히브리어 수 체계 (Number)",
    summary: "셋 이상의 다수 개체뿐 아니라, 위엄의 극대화(Plural of Majesty)나 무한한 충만성을 나타내는 수 형태",
    mechanics: "남성 어미 '-임(ִים)', 여성 어미 '-오트(וֹת)'가 결합합니다.",
    syntax: "수치적 복수(Numerical Plural)와 함께 단수 동사를 취하는 장엄 복수(Majestic Plural) 구문을 이룹니다.",
    theology: "하나님의 칭호 '엘로힘(אֱלֹהִים)'이 복수형임에도 창세기 1:1에서 단수 동사 '바라(창조하시니라)'를 취하는 것은 삼위일체 하나님의 신비로운 단일성과 무한한 위엄을 입증합니다.",
    canonicalCases: [
      { ref: "창세기 1:1", text: "엘로힘 (하나님들/장엄복수)", note: "단수 동사와 결합하여 삼위일체의 장엄한 단일성 계시" },
      { ref: "이사야 6:8", text: "누가 우리를 위하여 갈꼬", note: "신격 내부의 삼위 간의 구속사적 회의 암시" }
    ]
  },
  "hebrew_number_du": {
    id: "hebrew_number_du",
    token: "쌍수 (Dual)",
    originalTerm: "Dual Number (쌍수, 태그: du)",
    lang: "히브리어",
    category: "히브리어 수 체계 (Number)",
    summary: "자연스러운 한 쌍(2개)을 이루는 인체 기관이나 시공간의 대칭적 조화를 지칭하는 고유 문법 범주",
    mechanics: "명사 어간 뒤에 고유 쌍수 어미인 '-아이임(ַיִם)'이 결합합니다.",
    syntax: "두 개로 짝지어진 눈, 귀, 손, 발뿐 아니라 하늘(샤마이임), 물(마이임) 등 우주적 대칭 구조를 묘사합니다.",
    theology: "보이는 하늘과 영적 하늘, 궁창 위의 물과 아래의 물 등 창조주께서 지으신 우주의 질서 정연한 대칭적 조화를 웅변합니다.",
    canonicalCases: [
      { ref: "창세기 1:1", text: "하-샤마이임 (그 하늘들)", note: "물리적 하늘과 하나님의 영광이 깃든 영적 하늘의 쌍수적 조화" },
      { ref: "출애굽기 17:12", text: "야다우 (그의 두 손)", note: "모세의 두 손이 아론과 훌에 의해 받쳐진 기도의 대칭성" }
    ]
  },

  // ===================================================================
  // [C] 구약 히브리어 명사의 상태 및 특수 접사 (States & Suffixes)
  // ===================================================================
  "hebrew_state_absolute": {
    id: "hebrew_state_absolute",
    token: "절대형 (Absolute)",
    originalTerm: "Absolute State (절대형, 태그: a)",
    lang: "히브리어",
    category: "히브리어 명사 형태론 / 통사론",
    summary: "후속 명사에 종속되지 않고 완전한 고유 악센트와 장모음을 온전히 유지하며 홀로 자립하는 본원적 형태",
    mechanics: "어떠한 음운 축약(Vocalic Reduction)도 겪지 않으며, 고유의 악센트 위치를 온전히 보존합니다.",
    syntax: "독립된 주어, 목적어, 혹은 자립 부사구로 기능하며 완결된 개념을 선포합니다.",
    theology: "창세기 1:1의 '레쉬트(태초)'가 절대형인 것은 피조 세계 이전의 '절대 무(無)로부터의 창조(Creatio ex nihilo)'를 선포하는 결정적 신학적 근거입니다.",
    canonicalCases: [
      { ref: "창세기 1:1", text: "베레쉬트 (태초에)", note: "어떠한 선행 조건도 없는 절대적 시초 선포" }
    ]
  },
  "hebrew_state_construct": {
    id: "hebrew_state_construct",
    token: "연계형 (Construct)",
    originalTerm: "Construct State (Smikhut / 연계형, 태그: c)",
    lang: "히브리어",
    category: "히브리어 명사 형태론 / 통사론",
    summary: "뒤따르는 명사와 밀착 결합하여 '~의 (명사)'(소유·종속·밀착)를 형성하기 위해 전방 단어의 모음이 압축된 형태",
    mechanics: "선행 명사가 악센트를 후속 명사로 넘겨주며 장모음이 단모음이나 쉐와(ְ)로 급격히 축약됩니다.",
    syntax: "두 명사 사이에 분리될 수 없는 강력한 속격 사슬(Genitive Chain)을 구축합니다.",
    theology: "'여호와의 종', '언약의 책'처럼 성도의 존재와 정체성이 하나님께 전적으로 예속되어 있을 때만 온전해짐을 나타냅니다.",
    canonicalCases: [
      { ref: "잠언 1:7", text: "레쉬트 다아트 (지식의 근본)", note: "지식의 본질이 여호와 경외에 단단히 결속됨을 증명" }
    ]
  },
  "hebrew_he_directive": {
    id: "hebrew_he_directive",
    token: "방향격 헤 (Directive He)",
    originalTerm: "Directive He (방향격, 태그: he)",
    lang: "히브리어",
    category: "히브리어 특수 통사론",
    summary: "명사 어미에 무악센트 '헤(ָה)'가 붙어 전치사 없이도 '~을 향하여, ~로'라는 지향점과 목적지를 가리키는 고대 곡용격 잔재",
    mechanics: "단어의 마지막 자음에 장모음 카메츠와 묵음 헤가 붙으며 악센트는 앞으로 이동하지 않습니다.",
    syntax: "방향 전치사를 대신하여 지리적 이동 경로와 영적 도달 목표를 한정합니다.",
    theology: "성도의 삶이 정처 없는 유랑이 아니라, 하나님의 산 시온과 약속의 땅을 향해 한 걸음씩 나아가는 거룩한 순례임을 선언합니다.",
    canonicalCases: [
      { ref: "창세기 12:10", text: "미츠라이마 (애굽으로)", note: "기근 속에서 시험의 땅 애굽을 향해 내려간 여정" }
    ]
  },
  "hebrew_pronominal_suffix": {
    id: "hebrew_pronominal_suffix",
    token: "접미인칭대명사 (Pronominal Suffix)",
    originalTerm: "Pronominal Suffix (접미인칭대명사, 태그: prs)",
    lang: "히브리어",
    category: "히브리어 형태론 / 대명사",
    summary: "명사 뒤에 붙어 '나의, 너의, 그의'(소유격)가 되거나, 동사 뒤에 붙어 '나를, 그를'(직접목적격)이 되는 축약형 대명사",
    mechanics: "단어 말미에 결합하며 앞 단어의 모음 체계를 연계형 수준으로 변화시킵니다.",
    syntax: "문장 구조를 압축하면서 소유권의 귀속과 행위의 직접적 수혜자를 직관적으로 명시합니다.",
    theology: "'나의 목자(로이)', '나의 반석'처럼 하나님과 성도 사이의 인격적이고 배타적인 언약적 친밀성을 고백하는 핵심 문법 장치입니다.",
    canonicalCases: [
      { ref: "시편 23:1", text: "로이 (나의 목자)", note: "우주적 하나님을 '나의' 목자로 인격화하여 고백하는 언약적 신뢰" }
    ]
  },

  // ===================================================================
  // [D] 구약 히브리어 7대 동사 어간 (Binyanim / Stems)
  // ===================================================================
  "hebrew_stem_qal": {
    id: "hebrew_stem_qal",
    token: "칼 어간 (Qal)",
    originalTerm: "Qal (단순 능동, 태그: qal)",
    lang: "히브리어",
    category: "동사 어간 체계 (Binyan)",
    summary: "인위적 사역이나 강조가 첨가되지 않은, 주어의 행동을 역사적 사실 그대로 선포하는 기본 능동태",
    mechanics: "가장 가벼운 기본 모음 체계로만 활용되며 추가 접두사나 중복점이 없습니다.",
    syntax: "단순 능동 문맥의 뼈대를 형성하며 성경 역사 서술의 절대다수를 차지합니다.",
    theology: "창조(바라)가 칼로 선포된 것은 하나님의 창조가 피조물과의 투쟁이나 노동이 아니라 순수한 절대 권능의 역사임을 보여줍니다.",
    canonicalCases: [
      { ref: "창세기 1:1", text: "바라 (창조하시니라)", note: "신적 권능의 순수 능동적 선포" }
    ]
  },
  "hebrew_stem_nif": {
    id: "hebrew_stem_nif",
    token: "니팔 어간 (Niphal)",
    originalTerm: "Niphal (단순 수동 / 신적 수동 / 재귀, 태그: nif)",
    lang: "히브리어",
    category: "동사 어간 체계 (Binyan)",
    summary: "칼(Qal)의 수동태이자 재귀형으로, 인간의 행위가 배제된 하나님의 주권적 역사(신적 수동태)를 나타냄",
    mechanics: "완료형에서는 접두사 '눈(נ)'이 결합하며, 미완료형에서는 접두사가 첫 자음 속으로 동화되어 중복점을 형성합니다.",
    syntax: "단순 수동태(Passive) 혹은 주어가 스스로를 내어맡기는 재귀형(Reflexive)으로 작동합니다.",
    theology: "구속사에서 인간의 공로를 차단하고 '오직 은혜로 말미암는 구원'을 확증할 때 쓰입니다.",
    canonicalCases: [
      { ref: "창세기 12:3", text: "베니브레쿠 (복을 얻을 것이라)", note: "모든 족속이 아브라함 안에서 수동적으로 복을 덧입음" }
    ]
  },
  "hebrew_stem_piel": {
    id: "hebrew_stem_piel",
    token: "피엘 어간 (Piel)",
    originalTerm: "Piel (강조 능동 / 사실적 완성, 태그: piel)",
    lang: "히브리어",
    category: "동사 어간 체계 (Binyan)",
    summary: "단순 행동을 넘어 맹렬한 집중, 반복, 그리고 행동의 철저한 결과 완성을 나타내는 강력한 능동형",
    mechanics: "가운데 자음(제2어근)에 중복점(Dagesh Forte)이 찍히며 발음이 강화됩니다.",
    syntax: "미완료 상태를 완전한 결과 상태로 몰아넣는 사실적 완성(Factitive / Resultative)의 성격을 띱니다.",
    theology: "하나님의 거룩한 심판이나 전적인 성별, 언약의 맹세가 타협 없이 완결됨을 보여줍니다.",
    canonicalCases: [
      { ref: "창세기 1:2", text: "메라헤페트 (운행하시니라)", note: "성령께서 수면 위에 알을 품듯 맹렬히 집중하여 보호하심" }
    ]
  },
  "hebrew_stem_pual": {
    id: "hebrew_stem_pual",
    token: "푸알 어간 (Pual)",
    originalTerm: "Pual (강조 수동, 태그: pual)",
    lang: "히브리어",
    category: "동사 어간 체계 (Binyan)",
    summary: "피엘(Piel)의 수동형으로, 극렬하고 집중적인 행동의 결과가 대상에게 온전히 귀속되었음을 선포",
    mechanics: "제2어근의 중복점과 함께 제1어근 아래에 어두운 모음 키부츠(ֻ)가 결합합니다.",
    syntax: "주어가 피엘의 강력한 행위 결과를 저항 없이 온전히 받아들인 상태를 묘사합니다.",
    theology: "신자의 존재가 하나님의 세밀한 손길에 의해 철저하게 빚어지고 구별되었음을 증거합니다.",
    canonicalCases: [
      { ref: "시편 139:15", text: "룻캄티 (기묘하게 지음 받은)", note: "모태에서 세밀하게 빚어진 창조의 신비" }
    ]
  },
  "hebrew_stem_hif": {
    id: "hebrew_stem_hif",
    token: "히필 어간 (Hiphil)",
    originalTerm: "Hiphil (사역 능동, 태그: hif)",
    lang: "히브리어",
    category: "동사 어간 체계 (Binyan)",
    summary: "주어가 제3자에게 행동이나 상태를 필연적으로 유발·초래시키는 원인 제공적 사역형",
    mechanics: "접두사 '헤(ה)'와 모음 '히릭-요드(ִי)'가 결합합니다.",
    syntax: "문장 내에 목적어를 하나 더 취하여 사역 구조를 확립합니다.",
    theology: "구원의 원인 제공자가 오직 하나님이심을 밝히며, 믿음조차 주께서 주신 선물임을 확증합니다.",
    canonicalCases: [
      { ref: "창세기 15:6", text: "헤에민 (믿으니)", note: "하나님의 언약 앞에 견고히 서도록 이끄신 사역적 은혜" }
    ]
  },
  "hebrew_stem_hof": {
    id: "hebrew_stem_hof",
    token: "호팔 어간 (Hophal)",
    originalTerm: "Hophal (사역 수동, 태그: hof)",
    lang: "히브리어",
    category: "동사 어간 체계 (Binyan)",
    summary: "히필(Hiphil)의 수동형으로, 절대적인 외부 원인 제공자에 의해 대상이 불가항력적으로 그 상태에 놓이게 됨을 선포",
    mechanics: "접두사 '헤(ה)' 아래에 카메츠-하투프(ָ) 또는 키부츠가 결합합니다.",
    syntax: "주어가 외부의 주권적 사역에 의해 저항할 수 없이 이끌려감을 표현합니다.",
    theology: "하나님의 절대 주권 앞에서 인간이 거역할 수 없는 구속 경륜에 이끌려감을 선언합니다.",
    canonicalCases: [
      { ref: "창세기 40:20", text: "훌라드 (출생한 날)", note: "생명의 탄생이 오직 창조주의 주권으로 이루어짐" }
    ]
  },
  "hebrew_stem_hit": {
    id: "hebrew_stem_hit",
    token: "히트파엘 어간 (Hitpael)",
    originalTerm: "Hitpael (강조 재귀 / 성별, 태그: hit)",
    lang: "히브리어",
    category: "동사 어간 체계 (Binyan)",
    summary: "피엘의 집중도에 재귀적 성격이 결합하여, 주어가 자기 자신을 향해 전인격적으로 반응하고 결단함을 묘사",
    mechanics: "접두사 '히트-(הִתְ)'가 붙고 제2어근에 중복점이 찍힙니다.",
    syntax: "스스로를 성결케 하거나 회개하고 하나님과 지속적으로 동행하는 주체적 순종을 가리킵니다.",
    theology: "성도가 하나님의 거룩하심 앞에 전존재를 바쳐 회개하고 거룩을 지켜야 하는 실존적 반응을 촉구합니다.",
    canonicalCases: [
      { ref: "창세기 5:24", text: "바이트할레크 (동행하더니)", note: "에녹이 하나님과 인격적으로 지속하여 발맞추어 동행함" }
    ]
  },

  // ===================================================================
  // [E] 구약 히브리어 시상 및 서술 체계 (TAM & Discourse)
  // ===================================================================
  "hebrew_aspect_perf": {
    id: "hebrew_aspect_perf",
    token: "완료형 (Qatal)",
    originalTerm: "Perfect / Suffix Conjugation (완료, 태그: perf)",
    lang: "히브리어",
    category: "히브리어 동사 시상론",
    summary: "사건이 이미 완결되었거나, 하나님의 작정 안에서 취소 불가능하게 확정된 상태를 선포",
    mechanics: "어근 뒤에 인칭 접미사가 결합하는 접미 활용(Suffix Conjugation)입니다.",
    syntax: "역사적 과거 사실뿐 아니라 선지자적 완료(Prophetic Perfect)로 미래 구원을 확정 선언합니다.",
    theology: "하나님의 언약은 시공간을 초월하여 이미 성취된 것과 같다는 절대적 확실성을 보증합니다.",
    canonicalCases: [
      { ref: "이사야 9:6", text: "율라드 라누 (우리에게 났고)", note: "메시아의 탄생을 이미 완료된 사건으로 확정 선언" }
    ]
  },
  "hebrew_aspect_impf": {
    id: "hebrew_aspect_impf",
    token: "미완료형 (Yiqtol)",
    originalTerm: "Imperfect / Prefix Conjugation (미완료, 태그: impf)",
    lang: "히브리어",
    category: "히브리어 동사 시상론",
    summary: "사건이 종결되지 않고 현재 진행 중이거나, 장차 반드시 이루어질 미래의 성취와 지속을 의미",
    mechanics: "어근 앞에 인칭 접두사가 결합하는 접두 활용(Prefix Conjugation)입니다.",
    syntax: "미래 시제, 반복적 습관, 가능성, 양태를 폭넓게 표현합니다.",
    theology: "하나님의 구속 경륜이 쉬지 않고 역사의 종말을 향해 역동적으로 전진하고 있음을 선포합니다.",
    canonicalCases: [
      { ref: "출애굽기 3:14", text: "에흐예 (스스로 있는 자)", note: "영원토록 현재진행형으로 자존하시는 하나님의 성품" }
    ]
  },
  "hebrew_aspect_wayq": {
    id: "hebrew_aspect_wayq",
    token: "바이크톨 (Wayyiqtol)",
    originalTerm: "Wayyiqtol (연속과거법, 태그: wayq)",
    lang: "히브리어",
    category: "히브리어 구문론 / 서술 기법",
    summary: "접속사 와우(ו)와 미완료 동사가 결합하여 과거 사건들을 오차 없는 섭리의 인과 사슬로 연결하는 서술법",
    mechanics: "접속사 와우 뒤에 모음 파타흐(ַ)와 자음 중복점이 붙으며 악센트가 전진합니다.",
    syntax: "구약 역사 서술의 핵심 축으로, 사건들이 필연적 연쇄 반응을 일으키며 이어짐을 나타냅니다.",
    theology: "우발적 파편이 아니라 모든 역사가 하나님의 절대 주권 아래 맞물려 돌아감을 증명합니다.",
    canonicalCases: [
      { ref: "창세기 1:3", text: "바요메르 (말씀하시니라)", note: "창조의 명령이 섭리의 사슬 속에서 직렬 성취됨" }
    ]
  },
  "hebrew_aspect_infc": {
    id: "hebrew_aspect_infc",
    token: "연계부정사 (Infinitive Construct)",
    originalTerm: "Infinitive Construct (연계부정사, 태그: infc)",
    lang: "히브리어",
    category: "히브리어 동사 통사론",
    summary: "동사의 의미를 품고 명사처럼 전치사와 결합하여 시간, 목적, 원인을 나타내는 동명사적 형태",
    mechanics: "전치사 '베(בְּ, ~할 때에)'나 '레(לְ, ~하기 위하여)'와 결합합니다.",
    syntax: "주절의 행동이 일어나는 시점이나 신적 목적을 한정합니다.",
    theology: "역사의 모든 사건 이면에 하나님의 명확한 구속사적 목적과 계기가 있음을 보여줍니다.",
    canonicalCases: [
      { ref: "창세기 2:4", text: "베히바르암 (창조될 때에)", note: "천지 창조의 시간적 계기 명시" }
    ]
  },
  "hebrew_aspect_infa": {
    id: "hebrew_aspect_infa",
    token: "절대부정사 (Infinitive Absolute)",
    originalTerm: "Infinitive Absolute (절대부정사, 태그: infa)",
    lang: "히브리어",
    category: "히브리어 동사 통사론",
    summary: "본동사 앞뒤에 놓여 행동의 확실성, 필연성, 강도를 극대화하는 히브리어 특유의 강조 수사법",
    mechanics: "고정된 장모음 형태를 취하며 본동사와 병치됩니다.",
    syntax: "'반드시 성취되리라'는 절대적 확실성을 선언합니다.",
    theology: "하나님의 언약과 심판의 절대성을 타협 없이 선포합니다.",
    canonicalCases: [
      { ref: "창세기 2:17", text: "모트 타무트 (반드시 죽으리라)", note: "선악과 언약 파기의 필연적 심판 강조" }
    ]
  },
  "hebrew_aspect_ptca": {
    id: "hebrew_aspect_ptca",
    token: "능동분사 (Active Participle)",
    originalTerm: "Participle Active (능동분사, 태그: ptca)",
    lang: "히브리어",
    category: "히브리어 동사 형태론",
    summary: "지금 이 순간에도 쉬지 않고 지속되는 하나님의 통치와 사역을 생생하게 묘사하는 형태",
    mechanics: "제1어근 뒤에 홀렘 모음이 오며 명사처럼 성과 수를 취합니다.",
    syntax: "행위자 실체로 쓰이거나 현재 계속되는 사역을 선언합니다.",
    theology: "하나님은 졸지도 주무시지도 않고 지금도 살아 역사하시는 주권자이심을 증거합니다.",
    canonicalCases: [
      { ref: "시편 121:4", text: "쇼메르 이스라엘 (이스라엘을 지키시는 이)", note: "쉬지 않는 하나님의 현재적 돌보심" }
    ]
  },
  "hebrew_aspect_ptcp": {
    id: "hebrew_aspect_ptcp",
    token: "수동분사 (Passive Participle)",
    originalTerm: "Participle Passive (수동분사, 태그: ptcp)",
    lang: "히브리어",
    category: "히브리어 동사 형태론",
    summary: "행동의 결과가 주어에게 온전히 임하여 확정된 축복이나 영적 상태를 나타내는 형태",
    mechanics: "제2어근 뒤에 슈루크(וּ) 모음이 결합합니다.",
    syntax: "수동적 결과 상태가 영구히 정착되었음을 서술합니다.",
    theology: "하나님의 복이 성도에게 취소 불가능하게 머물러 있음을 선포합니다.",
    canonicalCases: [
      { ref: "시편 118:26", text: "바루크 (찬송을 받을 자여 / 복된 자여)", note: "여호와의 이름으로 오는 자의 확정된 복" }
    ]
  },

  // ===================================================================
  // [F] 신약 헬라어 격 체계 (Greek 8-Case System)
  // ===================================================================
  "greek_case_nominative": {
    id: "greek_case_nominative",
    token: "주격 (Nominative)",
    originalTerm: "Nominative Case (주격, 태그: N)",
    lang: "헬라어",
    category: "신약 헬라어 격 체계 (Case)",
    summary: "문장의 주어이자 명명의 격이며, 존재의 본질과 신적 정체성을 규정하는 으뜸격",
    mechanics: "명사 제1, 2, 3변화의 기본 주격 어미를 취하며 관사와 결합합니다.",
    syntax: "문장의 주어 혹은 계사 동사와 함께 술어 주격(Predicate Nominative)으로 기능합니다.",
    theology: "요한복음 1:1의 무관사 술어 주격 '테오스'는 로고스가 성부와 동일한 신적 본질을 가지신 참 하나님이심을 정밀하게 입증합니다.",
    canonicalCases: [
      { ref: "요한복음 1:1", text: "테오스 ēn 호 로고스 (말씀은 하나님이시니라)", note: "성자의 완전한 신성을 본질적으로 규정" }
    ]
  },
  "greek_case_genitive": {
    id: "greek_case_genitive",
    token: "속격 / 탈격 (Genitive / Ablative)",
    originalTerm: "Genitive / Ablative Case (속격, 태그: G)",
    lang: "헬라어",
    category: "신약 헬라어 격 체계 (Case)",
    summary: "소유, 기원, 정의, 분리를 나타내며 신자의 생명과 구원이 누구에게 뿌리를 두는지를 한정하는 격",
    mechanics: "명사 어간에 '-우', '-오스' 등의 어미가 결합하며 탈격(Ablative, 분리/출처) 기능까지 통합했습니다.",
    syntax: "소유 속격, 기원 속격, 주격적/목적격적 속격, 독립 속격(Genitive Absolute)으로 기능합니다.",
    theology: "'하나님의 의(디카이오쉬네 테우)'에서 속격은 구원의 의가 인간의 공로가 아닌 하나님께로부터 기원한 선물임을 밝힙니다.",
    canonicalCases: [
      { ref: "로마서 1:17", text: "디카이오쉬네 테우 (하나님의 의)", note: "하나님께로부터 기원한 구원의 의" }
    ]
  },
  "greek_case_dative": {
    id: "greek_case_dative",
    token: "여격 / 처격 / 도구격 (Dative / Locative / Instrumental)",
    originalTerm: "Dative Case (여격, 태그: D)",
    lang: "헬라어",
    category: "신약 헬라어 격 체계 (Case)",
    summary: "은혜의 수혜처, 시공간적 영역, 그리고 구원을 이루는 유일한 수단을 묘사하는 다차원 통합격",
    mechanics: "단수에서는 모음 아래 이오타 하기(ᾳ, ῃ, ῳ)가 붙습니다.",
    syntax: "간접목적어(순수여격), 영적 영역(처격, Sphere), 수단과 원인(도구격, Means)을 포괄합니다.",
    theology: "'은혜로 말미암아(도구격)'와 '그리스도 안에서(처격)'는 성도의 구원의 수단과 유효 영역을 확정합니다.",
    canonicalCases: [
      { ref: "에베소서 2:8", text: "테 가르 카리티 (은혜에 의하여)", note: "구원의 동력이 전적인 신적 은혜임을 선포" }
    ]
  },
  "greek_case_accusative": {
    id: "greek_case_accusative",
    token: "대격 (Accusative)",
    originalTerm: "Accusative Case (대격, 태그: A)",
    lang: "헬라어",
    category: "신약 헬라어 격 체계 (Case)",
    summary: "동사의 행위가 가닿는 직접 목적어이자, 하나님의 은혜와 심판이 미치는 구체적 범위를 한정하는 격",
    mechanics: "단수 어미 '-온', '-안', '-아' 및 복수 어미 '-우스', '-아스'가 결합합니다.",
    syntax: "직접 목적어, 공간적/시간적 한정 대격으로 기능합니다.",
    theology: "'세상을(대격) 사랑하사'에서 하나님의 대속적 사랑이 죄악 된 피조 세계 전체를 정면으로 품으셨음을 드러냅니다.",
    canonicalCases: [
      { ref: "요한복음 3:16", text: "톤 코스몬 (세상을 사랑하사)", note: "신적 대속 사랑의 직접적 대상 선언" }
    ]
  },
  "greek_case_vocative": {
    id: "greek_case_vocative",
    token: "호격 (Vocative)",
    originalTerm: "Vocative Case (호격, 태그: V)",
    lang: "헬라어",
    category: "신약 헬라어 격 체계 (Case)",
    summary: "대상을 인격적으로 직접 부르고 탄원하며 친밀한 기도를 올릴 때 사용하는 직접 호칭격",
    mechanics: "명사 제1, 2, 3변화에서 고유 호격 어미를 취하거나 주격 형태를 차용합니다.",
    syntax: "문장의 독립적 요소로 기능하며 청자의 즉각적인 주의와 반응을 촉구합니다.",
    theology: "'주여(퀴리에)', '아바 아버지(아바 호 파테르)'처럼 성도가 하나님 보좌 앞으로 나아가 올리는 인격적 간구의 통로입니다.",
    canonicalCases: [
      { ref: "마태복음 8:25", text: "퀴리에 소손 (주여 구원하소서)", note: "절체절명의 위기에서 그리스도의 신적 주권을 부르는 호격" }
    ]
  },

  // ===================================================================
  // [G] 신약 헬라어 동사 시제 및 양상 (Verbal Aspect)
  // ===================================================================
  "greek_tense_present": {
    id: "greek_tense_present",
    token: "현재 시제 (Present)",
    originalTerm: "Present Tense (현재, 태그: P)",
    lang: "헬라어",
    category: "신약 헬라어 시제론",
    summary: "지속적이고 반복적인 진행 과정(Linear Aspect)을 나타내며, 매일의 삶 속에서 쉬지 않고 순종해야 할 현재적 상태",
    mechanics: "동사의 기본 어간에 일차 주어 어미가 결합합니다.",
    syntax: "계속적 현재(Progressive), 습관적 현재(Habitual), 진리 선언적 현재(Gnomic)로 활용됩니다.",
    theology: "'죄를 짓지 아니하나니(현재)'는 참 신자가 습관적·지속적으로 죄의 지배 아래 머물러 살 수 없음을 입증합니다.",
    canonicalCases: [
      { ref: "요한일서 3:9", text: "하마르티안 우 포이에이 (범죄하지 아니하나니)", note: "거듭난 자의 습관적 죄악 단절" }
    ]
  },
  "greek_tense_imperfect": {
    id: "greek_tense_imperfect",
    token: "미완료 시제 (Imperfect)",
    originalTerm: "Imperfect Tense (미완료, 태그: I)",
    lang: "헬라어",
    category: "신약 헬라어 시제론",
    summary: "과거의 어느 시점에서 행동이 단번에 끝나지 않고 생생하게 지속되거나 반복되었던 과정을 묘사",
    mechanics: "동사 어간 앞에 과거 시간 증음(Augment, 에-)이 붙고 이차 어미가 결합합니다.",
    syntax: "과거의 지속적 행동, 시도했으나 미완성된 행동(Conative)을 표현합니다.",
    theology: "십자가 위에서 예수께서 원수들의 용서를 반복해서 구하셨던 치열한 기도의 지속성을 전합니다.",
    canonicalCases: [
      { ref: "누가복음 23:34", text: "엘레겐 (예수께서 이르시되)", note: "고통 중에도 반복해서 용서를 간구하신 주님의 미완료 기도" }
    ]
  },
  "greek_tense_future": {
    id: "greek_tense_future",
    token: "미래 시제 (Future)",
    originalTerm: "Future Tense (미래, 태그: F)",
    lang: "헬라어",
    category: "신약 헬라어 시제론",
    summary: "단순한 시간적 내일을 넘어, 하나님의 신실하신 약속에 근거한 종말론적 확실성을 선포",
    mechanics: "어간 뒤에 미래 시제 표지 시그마(σ)가 결합합니다.",
    syntax: "예언적 미래(Predictive), 명령적 미래로 사용됩니다.",
    theology: "성도의 부활과 영원한 영광의 도래가 변개될 수 없는 신적 약속에 묶여 있음을 증언합니다.",
    canonicalCases: [
      { ref: "마태복음 1:21", text: "소세이 (구원할 자이심이라)", note: "자기 백성을 죄에서 건져내실 메시아의 절대적 성취 확언" }
    ]
  },
  "greek_tense_aorist": {
    id: "greek_tense_aorist",
    token: "부정과거 시제 (Aorist)",
    originalTerm: "Aorist Tense (부정과거, 태그: A)",
    lang: "헬라어",
    category: "신약 헬라어 시제론",
    summary: "시간의 경과나 지속에 얽매이지 않고, 단 한 번에(Once for all) 영원히 완성된 점적 사건을 총체적으로 선포",
    mechanics: "시제 접미사 '사(σα)' 결합 혹은 어간 모음 변화와 증음이 결합합니다.",
    syntax: "역사적 총체 선언(Constative), 미래 사건의 완결 선언(Proleptic)으로 기능합니다.",
    theology: "로마서 8:30에서 미래의 사건인 '영화'까지 부정과거(에독사센)로 선언하여 취소 불가능한 완성을 입증합니다.",
    canonicalCases: [
      { ref: "로마서 8:30", text: "에독사센 (영화롭게 하셨느니라)", note: "미래 영화를 이미 확정된 사실로 선포 (전향적 부정과거)" }
    ]
  },
  "greek_tense_perfect": {
    id: "greek_tense_perfect",
    token: "완료 시제 (Perfect)",
    originalTerm: "Perfect Tense (완료, 태그: R)",
    lang: "헬라어",
    category: "신약 헬라어 시제론",
    summary: "과거에 완성된 단회적 사건의 법적·영적 효력이 지금 현재까지 완전무결하게 존속되고 있음을 뜻하는 이중 시제",
    mechanics: "어간 첫 자음이 반복되는 중복음(Reduplication)과 접미사 '카(κα)'가 결합합니다.",
    syntax: "과거의 완료 상태와 현재의 결과 존속을 동시에 압축합니다.",
    theology: "십자가상의 선언 '테텔레스타이(다 이루었다)'의 시제로, 대속의 법적 유효성이 영원토록 유효함을 천명합니다.",
    canonicalCases: [
      { ref: "요한복음 19:30", text: "테텔레스타이 (다 이루었다)", note: "십자가 대속의 법적 효력이 영원토록 유효함" }
    ]
  },
  "greek_tense_pluperfect": {
    id: "greek_tense_pluperfect",
    token: "과거완료 시제 (Pluperfect)",
    originalTerm: "Pluperfect Tense (과거완료, 태그: L)",
    lang: "헬라어",
    category: "신약 헬라어 시제론",
    summary: "과거의 특정 시점 이전에 이미 완료되어 그 과거 시점까지 확고히 정착되어 있던 상태를 묘사",
    mechanics: "중복음과 함께 과거 증음(에-) 및 과거완료 어미가 결합합니다.",
    syntax: "과거 사건들 사이의 선후 관계와 기초적 선행 상태를 확정합니다.",
    theology: "하나님의 구원 작정과 반석 위에 세워진 신앙의 기초가 어떠한 풍파에도 이미 견고히 놓여 있었음을 증명합니다.",
    canonicalCases: [
      { ref: "마태복음 7:25", text: "테테멜리오토 (주춧돌을 반석 위에 놓은 까닭이요)", note: "이미 반석 위에 놓여 있던 불변의 기초" }
    ]
  },

  // ===================================================================
  // [H] 신약 헬라어 태(Voice)와 법(Mood)
  // ===================================================================
  "greek_voice_active": {
    id: "greek_voice_active",
    token: "능동태 (Active Voice)",
    originalTerm: "Active Voice (능동태, 태그: A)",
    lang: "헬라어",
    category: "신약 헬라어 동사 태론",
    summary: "주어가 행동의 직접적인 원인 제공자로서 자신의 의지적 결단에 따라 행동을 수행함을 나타냄",
    mechanics: "능동태 고유 인칭 어미를 취합니다.",
    syntax: "주어와 행위의 직접적 결합을 통해 역사적 행동의 주체를 확정합니다.",
    theology: "인류를 구원하시기 위해 독생자를 보내신 하나님의 주권적 의지와 사랑의 적극적 결단을 입증합니다.",
    canonicalCases: [
      { ref: "요한복음 3:16", text: "에도켄 (독생자를 주셨으니)", note: "구원을 위해 아들을 내어주신 능동적 사랑의 결단" }
    ]
  },
  "greek_voice_middle": {
    id: "greek_voice_middle",
    token: "중간태 (Middle Voice)",
    originalTerm: "Middle Voice (중간태, 태그: M)",
    lang: "헬라어",
    category: "신약 헬라어 동사 태론",
    summary: "주어가 자기 자신을 위하여 행동하거나, 행동의 결과에 깊은 인격적 연관을 맺고 동참함을 묘사",
    mechanics: "수동태와 어미를 공유하지만 통사적으로 주어의 자발성과 인격적 참여를 나타냅니다.",
    syntax: "간접적 유익(Benefactive)과 자발적 헌신을 표현합니다.",
    theology: "하나님께서 자기 백성을 택하실 때 의무가 아닌 '자기 자신을 위한 지극한 기쁨과 사랑'으로 택하셨음을 보여줍니다.",
    canonicalCases: [
      { ref: "에베소서 1:4", text: "엑셀렉사토 (택하시되)", note: "하나님께서 자기 자신을 위하여 우리를 기쁨으로 택하심" }
    ]
  },
  "greek_voice_passive": {
    id: "greek_voice_passive",
    token: "수동태 / 신적 수동태 (Passive / Passivum Divinum)",
    originalTerm: "Passive Voice (수동태, 태그: P)",
    lang: "헬라어",
    category: "신약 헬라어 동사 태론",
    summary: "주어가 행동을 당하거나, 행위자(하나님)의 이름을 경외하여 생략하고 신적 주권을 드러내는 형태",
    mechanics: "수동태 전용 어미를 취하며, 신적 수동태에서는 행위자 표시 전치사구('휘포 + 속격')가 의도적으로 생략됩니다.",
    syntax: "인간 주어를 감추고 하나님의 배후 섭리를 부각시킵니다.",
    theology: "팔복에서 '위로를 받을 것임이요'처럼 인간의 공로 없이 하나님께서 친히 역사하심을 선포합니다.",
    canonicalCases: [
      { ref: "마태복음 5:4", text: "파라클레데손타이 (위로를 받을 것임이요)", note: "하나님께서 친히 위로의 유일한 주체이심을 암시" }
    ]
  },
  "greek_voice_deponent": {
    id: "greek_voice_deponent",
    token: "디포넌트 (Deponent Voice)",
    originalTerm: "Deponent (디포넌트, 태그: D)",
    lang: "헬라어",
    category: "신약 헬라어 동사 태론",
    summary: "형태는 중간태나 수동태 어미를 취하지만, 실제 의미는 능동태로 작동하는 특수 동사 군",
    mechanics: "능동태 어미가 소멸되고 중간/수동 어미로 능동적 행위를 표현합니다.",
    syntax: "주어의 능동적 실행을 나타내면서도 내면의 인격적 관여를 함축합니다.",
    theology: "믿음으로 구원 얻는 길로 '오라(에르코마이)'는 초대처럼 전인격적 결단으로 응답해야 할 복음의 역동성을 담아냅니다.",
    canonicalCases: [
      { ref: "요한복음 1:39", text: "에르케스데 (와서 보라)", note: "그리스도를 향해 나아가는 전인격적 결단의 초대" }
    ]
  },
  "greek_mood_indicative": {
    id: "greek_mood_indicative",
    token: "직설법 (Indicative)",
    originalTerm: "Indicative Mood (직설법, 태그: I)",
    lang: "헬라어",
    category: "신약 헬라어 동사 법론",
    summary: "의심의 여지가 없는 객관적 역사 사실과 불변의 신적 진리를 선포하는 확실성의 법",
    mechanics: "시간 증음과 고유 직설법 어미를 온전히 취합니다.",
    syntax: "사실 진술의 기본 틀이며 교리적 토대를 놓습니다.",
    theology: "신자의 순종(명령법)은 언제나 그리스도께서 행하신 객관적 구원 사실(직설법)에 확고히 뿌리를 둡니다.",
    canonicalCases: [
      { ref: "고린도전서 15:3", text: "아페다넨 (그리스도께서 죽으시고)", note: "복음의 뼈대가 되는 역사적 객관 사실 선포" }
    ]
  },
  "greek_mood_subjunctive": {
    id: "greek_mood_subjunctive",
    token: "접속법 (Subjunctive)",
    originalTerm: "Subjunctive Mood (접속법, 태그: S)",
    lang: "헬라어",
    category: "신약 헬라어 동사 법론",
    summary: "하나님의 뜻 안에서 열려 있는 거룩한 가능성, 목적, 권면, 간절한 기도를 표현",
    mechanics: "연결 모음이 장모음(ω, η)으로 연장됩니다.",
    syntax: "목적 접속사 '히나'와 결합하거나 권면적 접속법으로 쓰입니다.",
    theology: "신자의 구원과 성화가 은혜 안에서 전인격적으로 순종해야 할 거룩한 동참임을 밝힙니다.",
    canonicalCases: [
      { ref: "히브리서 4:16", text: "프로세르코메타 (나아갈지니라)", note: "은혜의 보좌 앞으로 담대히 나아가자는 권면적 접속법" }
    ]
  },
  "greek_mood_imperative": {
    id: "greek_mood_imperative",
    token: "명령법 (Imperative)",
    originalTerm: "Imperative Mood (명령법, 태그: M)",
    lang: "헬라어",
    category: "신약 헬라어 동사 법론",
    summary: "직설법의 은혜에 근거하여 주어지는 거룩한 왕의 절대 주권적 요구이자 성도의 마땅한 순종",
    mechanics: "명령법 전용 어미를 취합니다.",
    syntax: "현재 명령법(지속적 순종)과 부정과거 명령법(즉각적 결단 실행)으로 나뉩니다.",
    theology: "하나님의 명령은 인간을 억압하는 굴레가 아니라 구원의 은혜를 세상에서 누리게 하는 생명의 규범입니다.",
    canonicalCases: [
      { ref: "마태복음 28:19", text: "마데튜사테 (제자를 삼으라)", note: "교회에 주신 지상 대명령의 핵심 부정과거 명령" }
    ]
  },
  "greek_mood_infinitive": {
    id: "greek_mood_infinitive",
    token: "부정사 (Infinitive)",
    originalTerm: "Infinitive (부정사, 태그: N)",
    lang: "헬라어",
    category: "신약 헬라어 동사 법론",
    summary: "인칭과 수의 제한을 받지 않고 동사의 동작을 목적, 결과, 시간, 원인으로 연결하는 동사적 명사",
    mechanics: "시제별 부정사 고유 어미(-에인, -사이 등)를 취하며 관사와 결합할 수 있습니다.",
    syntax: "주어, 목적어, 보어 역할을 하거나 전치사와 결합하여 종속절을 이룹니다.",
    theology: "구속사의 사건들이 우연이 아니라 성경을 응하게 하려는 목적 속에 전개됨을 입증합니다.",
    canonicalCases: [
      { ref: "빌립보서 1:21", text: "토 자엔 (사는 것이)", note: "내게 사는 것이 그리스도임을 선언하는 관사 동반 부정사" }
    ]
  },
  "greek_mood_participle": {
    id: "greek_mood_participle",
    token: "분사 (Participle)",
    originalTerm: "Participle (분사, 태그: P)",
    lang: "헬라어",
    category: "신약 헬라어 동사 법론 / 구문론",
    summary: "동사의 역동성과 형용사의 수식 기능을 결합하여 본동사의 행동을 둘러싼 배경을 입체적으로 조명",
    mechanics: "성, 수, 격에 따라 굴절하며 시제(현재, 부정과거, 완료)를 온전히 유지합니다.",
    syntax: "독립 속격, 관사 동반 실체화 분사, 부사적 부속 분사로 활용됩니다.",
    theology: "'나를 사랑하사 자기 자신을 버리신(분사)'처럼 주님의 은혜가 신자의 삶을 어떻게 둘러싸고 있는지를 묘사합니다.",
    canonicalCases: [
      { ref: "갈라디아서 2:20", text: "투 아가페산토스 메 (나를 사랑하사)", note: "십자가 사랑이 신자의 전 생애를 지탱함을 규정하는 분사" }
    ]
  }
};

// =====================================================================
// 🔍 [성경 66권 형태론 코드 ➔ 대화형 토큰 정밀 분해기 (1:1 완전 매핑)]
// =====================================================================
export function tokenizeGrammarCode(rawGrammar, isOT) {
  if (!rawGrammar || typeof rawGrammar !== 'string') return [];
  const g = rawGrammar.trim();
  const tokens = [];

  if (isOT) {
    // 히브리어 ETCBC 포맷 분해: subs.f.sg.a / verb.qal.perf.3ms / prep 등
    const parts = g.split('.');
    parts.forEach(part => {
      // 1. 품사 (POS)
      if (part === 'subs') tokens.push({ key: 'hebrew_pos_noun', label: '명사', raw: part });
      else if (part === 'nmpr') tokens.push({ key: 'hebrew_pos_proper_noun', label: '고유명사', raw: part });
      else if (part === 'adjv') tokens.push({ key: 'hebrew_pos_adj', label: '형용사', raw: part });
      else if (part === 'prep') tokens.push({ key: 'hebrew_pos_prep', label: '전치사', raw: part });
      else if (part === 'conj') tokens.push({ key: 'hebrew_pos_conj', label: '접속사', raw: part });
      else if (part === 'art') tokens.push({ key: 'hebrew_pos_art', label: '정관사', raw: part });
      else if (part === 'prps') tokens.push({ key: 'hebrew_pos_prps', label: '인칭대명사', raw: part });
      else if (part === 'prde') tokens.push({ key: 'hebrew_pos_prde', label: '지시대명사', raw: part });

      // 2. 성 (Gender)
      else if (part === 'm') tokens.push({ key: 'hebrew_gender_m', label: '남성', raw: part });
      else if (part === 'f') tokens.push({ key: 'hebrew_gender_f', label: '여성', raw: part });
      else if (part === 'c' && parts[0] !== 'subs') tokens.push({ key: 'hebrew_gender_c', label: '공성', raw: part });

      // 3. 수 (Number)
      else if (part === 'sg') tokens.push({ key: 'hebrew_number_sg', label: '단수', raw: part });
      else if (part === 'pl') tokens.push({ key: 'hebrew_number_pl', label: '복수', raw: part });
      else if (part === 'du') tokens.push({ key: 'hebrew_number_du', label: '쌍수', raw: part });

      // 4. 상태 및 접사 (State & Suffix)
      else if (part === 'a') tokens.push({ key: 'hebrew_state_absolute', label: '절대형(독립)', raw: part });
      else if (part === 'c' && parts[0] === 'subs') tokens.push({ key: 'hebrew_state_construct', label: '연계형(~의)', raw: part });
      else if (part === 'he') tokens.push({ key: 'hebrew_he_directive', label: '방향격(헤)', raw: part });
      else if (part === 'prs') tokens.push({ key: 'hebrew_pronominal_suffix', label: '접미대명사', raw: part });

      // 5. 7대 어간 (Binyanim)
      else if (part === 'qal') tokens.push({ key: 'hebrew_stem_qal', label: '칼(단순능동)', raw: part });
      else if (part === 'nif') tokens.push({ key: 'hebrew_stem_nif', label: '니팔(신적수동)', raw: part });
      else if (part === 'piel') tokens.push({ key: 'hebrew_stem_piel', label: '피엘(강조능동)', raw: part });
      else if (part === 'pual') tokens.push({ key: 'hebrew_stem_pual', label: '푸알(강조수동)', raw: part });
      else if (part === 'hif') tokens.push({ key: 'hebrew_stem_hif', label: '히필(사역능동)', raw: part });
      else if (part === 'hof') tokens.push({ key: 'hebrew_stem_hof', label: '호팔(사역수동)', raw: part });
      else if (part === 'hit') tokens.push({ key: 'hebrew_stem_hit', label: '히트파엘(재귀)', raw: part });

      // 6. 시상 (TAM)
      else if (part === 'perf') tokens.push({ key: 'hebrew_aspect_perf', label: '완료(Qatal)', raw: part });
      else if (part === 'impf') tokens.push({ key: 'hebrew_aspect_impf', label: '미완료(Yiqtol)', raw: part });
      else if (part === 'wayq') tokens.push({ key: 'hebrew_aspect_wayq', label: '바이크톨(연속)', raw: part });
      else if (part === 'infc') tokens.push({ key: 'hebrew_aspect_infc', label: '연계부정사', raw: part });
      else if (part === 'infa') tokens.push({ key: 'hebrew_aspect_infa', label: '절대부정사', raw: part });
      else if (part === 'ptca') tokens.push({ key: 'hebrew_aspect_ptca', label: '능동분사', raw: part });
      else if (part === 'ptcp') tokens.push({ key: 'hebrew_aspect_ptcp', label: '수동분사', raw: part });
    });
  } else {
    // 헬라어 Robinson 포맷 분해: V-AAI-3S, N-NSF, A-APM, PREP, CONJ 등
    if (g === 'PREP') tokens.push({ key: 'hebrew_pos_prep', label: '전치사', raw: g });
    else if (g === 'CONJ') tokens.push({ key: 'hebrew_pos_conj', label: '접속사', raw: g });
    else if (g.includes('-')) {
      const parts = g.split('-');
      const pos = parts[0];
      const details = parts[1] || '';

      // 1. 명사 / 형용사 / 대명사 / 관사
      if (['N', 'A', 'T', 'P', 'R', 'D', 'C', 'X', 'I'].includes(pos)) {
        if (pos === 'N') tokens.push({ key: 'hebrew_pos_noun', label: '명사', raw: pos });
        else if (pos === 'A') tokens.push({ key: 'hebrew_pos_adj', label: '형용사', raw: pos });
        else if (pos === 'T') tokens.push({ key: 'hebrew_pos_art', label: '정관사', raw: pos });
        else if (pos === 'P') tokens.push({ key: 'hebrew_pos_prps', label: '인칭대명사', raw: pos });
        else if (pos === 'D') tokens.push({ key: 'hebrew_pos_prde', label: '지시대명사', raw: pos });

        // 격 분석 (Case)
        const caseChar = details[0];
        if (caseChar === 'N') tokens.push({ key: 'greek_case_nominative', label: '주격', raw: 'N' });
        else if (caseChar === 'G') tokens.push({ key: 'greek_case_genitive', label: '속격/탈격', raw: 'G' });
        else if (caseChar === 'D') tokens.push({ key: 'greek_case_dative', label: '여격/처격', raw: 'D' });
        else if (caseChar === 'A') tokens.push({ key: 'greek_case_accusative', label: '대격', raw: 'A' });
        else if (caseChar === 'V') tokens.push({ key: 'greek_case_vocative', label: '호격', raw: 'V' });

        // 수 (Number)
        const numChar = details[1];
        if (numChar === 'S') tokens.push({ key: 'hebrew_number_sg', label: '단수', raw: 'S' });
        else if (numChar === 'P') tokens.push({ key: 'hebrew_number_pl', label: '복수', raw: 'P' });

        // 성 (Gender)
        const genChar = details[2];
        if (genChar === 'M') tokens.push({ key: 'hebrew_gender_m', label: '남성', raw: 'M' });
        else if (genChar === 'F') tokens.push({ key: 'hebrew_gender_f', label: '여성', raw: 'F' });
        else if (genChar === 'N') tokens.push({ key: 'hebrew_gender_c', label: '중성', raw: 'N' });
      }

      // 2. 동사 (Verb)
      if (pos === 'V' && details.length >= 3) {
        const tChar = details[0];
        const vChar = details[1];
        const mChar = details[2];

        // 시제 (Tense)
        if (tChar === 'P') tokens.push({ key: 'greek_tense_present', label: '현재(지속)', raw: 'P' });
        else if (tChar === 'I') tokens.push({ key: 'greek_tense_imperfect', label: '미완료(진행)', raw: 'I' });
        else if (tChar === 'F') tokens.push({ key: 'greek_tense_future', label: '미래(확신)', raw: 'F' });
        else if (tChar === 'A') tokens.push({ key: 'greek_tense_aorist', label: '부정과거(단회)', raw: 'A' });
        else if (tChar === 'R') tokens.push({ key: 'greek_tense_perfect', label: '완료(영구유효)', raw: 'R' });
        else if (tChar === 'L') tokens.push({ key: 'greek_tense_pluperfect', label: '과거완료', raw: 'L' });

        // 태 (Voice)
        if (vChar === 'A') tokens.push({ key: 'greek_voice_active', label: '능동태', raw: 'A' });
        else if (vChar === 'M') tokens.push({ key: 'greek_voice_middle', label: '중간태', raw: 'M' });
        else if (vChar === 'P') tokens.push({ key: 'greek_voice_passive', label: '신적수동태', raw: 'P' });
        else if (vChar === 'D') tokens.push({ key: 'greek_voice_deponent', label: '디포넌트', raw: 'D' });

        // 법 (Mood)
        if (mChar === 'I') tokens.push({ key: 'greek_mood_indicative', label: '직설법', raw: 'I' });
        else if (mChar === 'S') tokens.push({ key: 'greek_mood_subjunctive', label: '접속법', raw: 'S' });
        else if (mChar === 'M') tokens.push({ key: 'greek_mood_imperative', label: '명령법', raw: 'M' });
        else if (mChar === 'N') tokens.push({ key: 'greek_mood_infinitive', label: '부정사', raw: 'N' });
        else if (mChar === 'P') tokens.push({ key: 'greek_mood_participle', label: '분사구문', raw: 'P' });
      }
    }
  }

  return tokens.length > 0 ? tokens : [{ key: 'hebrew_pos_noun', label: g, raw: g }];
}