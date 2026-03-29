// api/renpyScreensConverter.js

const getFileName = (path) => {
    if (!path) return "";
    let pathStr = typeof path === 'object' ? (path.preview || path.url) : path;
    if (!pathStr) return "";
    let fileName = pathStr.split('/').pop().split('?')[0];
    try { return decodeURIComponent(fileName); } catch (e) { return fileName; }
};

const rgbaToHex = (colorStr) => {
    if (!colorStr) return "#ffffff"; 
    if (colorStr.startsWith("#")) {
        return colorStr.length === 7 ? colorStr + "ff" : colorStr;
    }
    const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!match) return "#ffffff";
    const r = parseInt(match[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(match[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(match[3], 10).toString(16).padStart(2, '0');
    const alpha = match[4] !== undefined ? parseFloat(match[4]) : 1.0;
    const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
    return `#${r}${g}${b}${a}`;
};

const getColorId = (rgbaValue) => {
    if (!rgbaValue) return 'pink';
    const match = rgbaValue.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return 'pink';
    const rgb = `${match[1]},${match[2]},${match[3]}`;
    const colorMap = { '255,182,193': 'pink', '0,0,0': 'black', '255,255,255': 'white', '173,216,230': 'blue', '205,180,219': 'purple' };
    return colorMap[rgb] || 'pink';
};

const safeFont = (fontName) => {
    if (!fontName || fontName === "시스템 폰트 사용" || fontName === "") return "DejaVuSans.ttf";
    if (!fontName.toLowerCase().endsWith(".ttf") && !fontName.toLowerCase().endsWith(".otf")) return `${fontName}.ttf`;
    return fontName;
};

const getBgStr = (frameType, bgColorVal, borderColorVal, useBorder, isNamebox) => {
    const w = isNamebox ? 180 : 1100;
    const h = isNamebox ? 50 : 250;

    if (frameType === 'retro') {
        const size = isNamebox ? 50 : 150;
        const prefix = isNamebox ? 'namebox' : 'dialog';
        return `Frame("images/retro_${prefix}_${getColorId(bgColorVal)}.png", ${size}, ${size}, tile=False)`;
    }

    const bgColorHex = rgbaToHex(bgColorVal); 
    const bdColorHex = rgbaToHex(borderColorVal || '#dddddd');

    // ⭐ 수정: xysize 고정을 없애서 박스가 글자 수에 맞춰 자유롭게 늘어나도록 변경!
    if (!useBorder) {
        return `Solid("${bgColorHex}")`; 
    }

    if (frameType === 'gothic') {
        const line1 = 1; const gap = 2; const line2 = 1; 
        const totalBw = line1 + gap + line2; 
        const innerW = w - (totalBw * 2);
        const innerH = h - (totalBw * 2);

        return `Composite((${w}, ${h}),
            (0, 0), Transform(Solid("${bdColorHex}"), xysize=(${w}, ${line1})),
            (0, ${h - line1}), Transform(Solid("${bdColorHex}"), xysize=(${w}, ${line1})),
            (0, ${line1}), Transform(Solid("${bdColorHex}"), xysize=(${line1}, ${h - line1 * 2})),
            (${w - line1}, ${line1}), Transform(Solid("${bdColorHex}"), xysize=(${line1}, ${h - line1 * 2})),
            (${line1}, ${line1}), Transform(Solid("${bgColorHex}"), xysize=(${w - line1 * 2}, ${gap})),
            (${line1}, ${h - line1 - gap}), Transform(Solid("${bgColorHex}"), xysize=(${w - line1 * 2}, ${gap})),
            (${line1}, ${line1 + gap}), Transform(Solid("${bgColorHex}"), xysize=(${gap}, ${h - (line1 + gap) * 2})),
            (${w - line1 - gap}, ${line1 + gap}), Transform(Solid("${bgColorHex}"), xysize=(${gap}, ${h - (line1 + gap) * 2})),
            (${line1 + gap}, ${line1 + gap}), Transform(Solid("${bdColorHex}"), xysize=(${w - (line1 + gap) * 2}, ${line2})),
            (${line1 + gap}, ${h - (line1 + gap) - line2}), Transform(Solid("${bdColorHex}"), xysize=(${w - (line1 + gap) * 2}, ${line2})),
            (${line1 + gap}, ${line1 + gap + line2}), Transform(Solid("${bdColorHex}"), xysize=(${line2}, ${h - (line1 + gap + line2) * 2})),
            (${w - (line1 + gap) - line2}, ${line1 + gap + line2}), Transform(Solid("${bdColorHex}"), xysize=(${line2}, ${h - (line1 + gap + line2) * 2})),
            (${totalBw}, ${totalBw}), Transform(Solid("${bgColorHex}"), xysize=(${innerW}, ${innerH}))
        )`;
    }

    let bw = 2;
    const sInnerW = w - (bw * 2);
    const sInnerH = h - (bw * 2);

    return `Composite((${w}, ${h}),
        (0, 0), Transform(Solid("${bdColorHex}"), xysize=(${w}, ${bw})),
        (0, ${h - bw}), Transform(Solid("${bdColorHex}"), xysize=(${w}, ${bw})),
        (0, ${bw}), Transform(Solid("${bdColorHex}"), xysize=(${bw}, ${sInnerH})),
        (${w - bw}, ${bw}), Transform(Solid("${bdColorHex}"), xysize=(${bw}, ${sInnerH})),
        (${bw}, ${bw}), Transform(Solid("${bgColorHex}"), xysize=(${sInnerW}, ${sInnerH}))
    )`;
};

export const generateScreensRpy = (data) => {
    // ⭐ 수정됨: characters 배열에서 주인공을 찾아 폰트 스타일을 가져옵니다.
    const protagonist = (data.characters || []).find(c => c.isProtagonist) || {};
    const pStyle = protagonist.fontStyle || {}; 
    
    const nStyle = data.narrationFontStyle || pStyle; 
    const ui = data.globalUi || {};
    const start = data.startMenu || {};
    
    const mainFont = safeFont(pStyle.font || ui.systemFont);
    const sysFont = safeFont(ui.systemFont || "Galmuri14"); 
    const mainColor = rgbaToHex(pStyle.color);
    
    const getPortraitBgStr = () => {
        if (pStyle.portraitStyle === 'retro') {
            return `Transform("images/retro_frame_${getColorId(pStyle.portraitColor)}.png", xysize=(250, 250))`;
        }
        const bgColorHex = rgbaToHex(pStyle.portraitColor);
        
        if (pStyle.usePortraitBorder === false) {
            return `Transform(Solid("${bgColorHex}"), xysize=(250, 250))`;
        }

        const bdColorHex = rgbaToHex(pStyle.portraitBorderColor || '#dddddd');
        const bw = 3; const size = 250; const inner = size - (bw * 2);
        
        return `Composite((${size}, ${size}), 
            (0, 0), Transform(Solid("${bdColorHex}"), xysize=(${size}, ${bw})), 
            (0, ${size - bw}), Transform(Solid("${bdColorHex}"), xysize=(${size}, ${bw})), 
            (0, ${bw}), Transform(Solid("${bdColorHex}"), xysize=(${bw}, ${inner})), 
            (${size - bw}, ${bw}), Transform(Solid("${bdColorHex}"), xysize=(${bw}, ${inner})), 
            (${bw}, ${bw}), Transform(Solid("${bgColorHex}"), xysize=(${inner}, ${inner})))`;
    };

    // ⭐ 수정됨: 레트로 달력 배경 관련 변수 삭제

    const calText = rgbaToHex(ui.calendarTextColor);
    const calLine = rgbaToHex(ui.calendarTextOutlineColor);
    
    const isBottomMode = ui.layoutMode === 'bottom';
    const dialog_y = isBottomMode ? 830 : 780;
    const portrait_y = isBottomMode ? 830 : 780;
    const namebox_y = isBottomMode ? 775 : 725;

    const t = start.title || {};
    const m = start.menu || {};
    const startBgUrl = start.bgImage ? getFileName(start.bgImage) : "bg_title.png";
    
    const mButtons = m.buttons || ['NEW GAME', 'LOAD', 'SETTING', 'EXIT'];

    const tSize = Math.round((t.fontSize !== undefined ? t.fontSize : 8) * 10.8);
    const mSize = Math.round((m.fontSize !== undefined ? m.fontSize : 4) * 10.8);
    
    const tX = (t.x !== undefined ? t.x : 50) / 100.0;
    const tY = (t.y !== undefined ? t.y : 30) / 100.0;
    const mX = (m.x !== undefined ? m.x : 50) / 100.0;
    const mY = (m.y !== undefined ? m.y : 75) / 100.0;

    const mPaddingRaw = m.padding !== undefined ? m.padding : 20;
    const mPadding = Math.round((mPaddingRaw / 10) * 19.2);

    const mSpacing = 22; 

    const aHex = Math.round((m.bgOpacity !== undefined ? m.bgOpacity : 0.5) * 255).toString(16).padStart(2, '0');
    const solidColor = rgbaToHex(m.bgColor || '#000000').slice(0, 7) + aHex;
    
    let mBgCode = `Solid("${solidColor}")`;
    if (m.useBorder) {
        const bdColor = rgbaToHex(m.borderColor || '#ffffff');
        mBgCode = `Frame(Composite((10, 10), (0,0), Transform(Solid("${bdColor}"), xysize=(10,2)), (0,8), Transform(Solid("${bdColor}"), xysize=(10,2)), (0,2), Transform(Solid("${bdColor}"), xysize=(2,6)), (8,2), Transform(Solid("${bdColor}"), xysize=(2,6)), (2,2), Transform(Solid("${solidColor}"), xysize=(6, 6))), 2, 2)`;
    }

    let rpy = `
init offset = 1

# ⭐ 메뉴, 설정, 선택지에 globalUi의 systemFont를 일괄 적용하는 스타일 정의
style default:
    font "${sysFont}"
    size 30

style gui_text is default:
    font "${sysFont}"

style button_text is default:
    font "${sysFont}"

style choice_button_text is button_text:
    font "${sysFont}"
    size 35
    outlines [(2, "#000000", 0, 0)]
    idle_color "#cccccc"
    hover_color "#ffffff"

style say_window is window:
    background None
    xanchor 0.0
    yanchor 0.0
    padding (30, 30, 30, 30)

style say_namebox is namebox:
    background None
    xanchor 0.0
    yanchor 0.0
    padding (0, 0, 0, 0)

style say_label:
    font "${mainFont}"
    size 32 
    bold True
    yalign 0.5
    xalign 0.5

style say_dialogue:
    font "${mainFont}"
    size 32
    line_spacing 5
    adjust_spacing False

    # 상단바 메뉴
# 상단바 메뉴
style ig_sysmenu_text is text:
    font "${sysFont}"
    size 20
    color "#ffffff"
    hover_color "#ffd43b"

style ig_sysmenu_button is button:
    background None
    padding (10, 5)

style start_menu_frame is frame:
    background ${mBgCode}
    padding (${mPadding}, ${mPadding}, ${mPadding}, ${mPadding})

style start_menu_button is button:
    background None
    padding (0, 0) 

style start_menu_button_text is text:
    font "${safeFont(m.font)}"
    size ${mSize}
    color "${rgbaToHex(m.color)}"
    ${m.useOutline ? `outlines [(2, "${rgbaToHex(m.outlineColor)}", 0, 0)]` : ""}
    hover_color "#ffd43b"

################################################################################
## 🎨 캐릭터별 전용 스타일 동적 생성
################################################################################
style p_window is say_window:
    background ${getBgStr(pStyle.dialogFrame, pStyle.dialogColor, pStyle.dialogBorderColor, pStyle.useDialogBorder !== false, false)}
style p_namebox is say_namebox:
    background ${getBgStr(pStyle.nameFrame, pStyle.nameColor, pStyle.nameBorderColor, pStyle.useNameBorder !== false, true)}

# ⭐ 추가: 나레이션 전용 대화창 스타일 정의 (이름표는 쓰지 않으므로 window만 생성)
style narration_window is say_window:
    background ${getBgStr(nStyle.dialogFrame, nStyle.dialogColor, nStyle.dialogBorderColor, nStyle.useDialogBorder !== false, false)}
`;

if (data.characters) {
        // ⭐ 수정됨: 주인공(isProtagonist: true)은 제외하고 나머지 캐릭터들만 스타일 생성
        data.characters.filter(c => !c.isProtagonist).forEach(char => {
            const cStyle = char.fontStyle || {};
            rpy += `
style char_${char.id}_window is say_window:
    background ${getBgStr(cStyle.dialogFrame, cStyle.dialogColor, cStyle.dialogBorderColor, cStyle.useDialogBorder !== false, false)}
style char_${char.id}_namebox is say_namebox:
    background ${getBgStr(cStyle.nameFrame, cStyle.nameColor, cStyle.nameBorderColor, cStyle.useNameBorder !== false, true)}
`;
        });
    }

    const portraitImageCode = pStyle.portraitStyle === 'retro' 
        ? `AlphaMask(Transform(getattr(store, "current_p_image", ""), xysize=(face_size, face_size), fit="cover"), Transform("images/retro_frame_mask.png", xysize=(face_size, face_size)))`
        : `Transform(getattr(store, "current_p_image", ""), xysize=(face_size, face_size), fit="cover")`;

    rpy += `
################################################################################
## 인게임 스크린 (Say)
################################################################################
screen say(who, what):
    $ ui_x = 250          
    $ face_size = 250      
    $ gap = 30             
    $ tb_w = 1100          
    $ tb_h = 250           
    $ namebox_w = 180      
    $ namebox_h = 50       
    $ box_x = ui_x + face_size + gap 

# ⭐ 수정: 상태바 텍스트 크기를 미리보기(2.5cqh = 약 27px)와 맞추고 간격 조절
    if getattr(store, "show_calendar", True):
        vbox:
            # xpos 250 (13%), ypos 50 (4.6%)
            xpos ui_x ypos 50 spacing 8
            
            # [current_month] (윗줄 텍스트) - size 38에서 27로 축소
            if current_month != "":
                text "[current_month]" size 27 color "${calText}" font "${sysFont}" ${ui.calendarTextUseOutline ? `outlines [(2, "${calLine}", 0, 0)]` : ""}
            
            # [current_time] (아랫줄 텍스트) - size 38에서 27로 축소
            if current_time != "":
                text "[current_time]" size 27 color "${calText}" font "${sysFont}" ${ui.calendarTextUseOutline ? `outlines [(2, "${calLine}", 0, 0)]` : ""}
# ⭐ 수정: 시스템 메뉴를 우측 상단으로 이동 & 대화창 끝부분에 맞춤
    hbox:
        # box_x(대화창 시작점) + tb_w(대화창 너비) = 대화창의 오른쪽 끝 지점
        xpos (box_x + tb_w) + 10
        ypos 20             # 상단 월/일/시간 텍스트와 높이를 맞춤
        xanchor 1.0         # 이 메뉴 박스의 '오른쪽 끝'을 기준점으로 삼음 (중요!)
        spacing 10          # 버튼 사이 간격 (미리보기 감성에 맞춰 살짝 조절)

        textbutton "되감기" action Rollback() text_style "ig_sysmenu_text" style "ig_sysmenu_button"
        textbutton "대사록" action ShowMenu('history') text_style "ig_sysmenu_text" style "ig_sysmenu_button"
        textbutton "자동진행" action Preference("auto-forward", "toggle") text_style "ig_sysmenu_text" style "ig_sysmenu_button"
        textbutton "저장하기" action ShowMenu('save') text_style "ig_sysmenu_text" style "ig_sysmenu_button"
        textbutton "불러오기" action ShowMenu('load') text_style "ig_sysmenu_text" style "ig_sysmenu_button"
        textbutton "설정" action ShowMenu('preferences') text_style "ig_sysmenu_text" style "ig_sysmenu_button"
    if getattr(store, "current_p_image", "") != "":
        fixed:
            xpos ui_x ypos ${portrait_y} xysize (face_size, face_size)
            add ${getPortraitBgStr()}
            add ${portraitImageCode} align(0.5, 0.5)

    window:
        id "window"
        xpos box_x ypos ${dialog_y} xsize tb_w ysize tb_h
        # ⭐ 수정: 대사 시작 위치를 미리보기(padding: 3cqh 4cqw)와 픽셀 단위로 똑같이 맞춤
        text what id "what":
            size 32
            pos (77, 32)       # 가로 77px(4cqw), 세로 32px(3cqh) 여백
            xsize (tb_w - 154) # 오른쪽 여백도 동일하게 남기기 위해 너비 조절

    if who is not None:
        window:
            id "namebox"
            xpos box_x ypos ${namebox_y}
            # ⭐ 수정: 고정 크기(xysize)를 지우고, 글자 수에 따라 동적으로 늘어나게 설정
            xminimum 134           # 최소 너비 (미리보기의 7cqw)
            yminimum 58 ymaximum 58 # 높이는 58px(5.4cqh)로 고정
            padding (19, 0, 19, 0)  # 좌우 여백 (미리보기의 1cqw)
            
            text who id "who":
                size 32
                align (0.5, 0.5)    # 네임박스 정중앙에 글자 배치

################################################################################
## 시작 메뉴 (Main Menu)
################################################################################
screen main_menu():
    tag menu
    add "${startBgUrl}" xysize (1920, 1080)
    
    ${(t.text !== undefined ? t.text : "최애로운 생활") !== "" ? `
        text "${t.text !== undefined ? t.text : "최애로운 생활"}":
            font "${safeFont(t.font)}" size ${tSize} color "${rgbaToHex(t.color)}" ${t.useOutline ? `outlines [(2, "${rgbaToHex(t.outlineColor)}", 0, 0)]` : ""}
            pos (${tX}, ${tY}) anchor (0.5, 0.5) text_align 0.5
        ` : ""}
        
    frame:
        style "start_menu_frame" 
        pos (${mX}, ${mY}) anchor (0.5, 0.5)
        
        vbox:
            spacing ${mSpacing} align (0.5, 0.5)
            textbutton "${mButtons[0]}" action Start() style "start_menu_button" text_style "start_menu_button_text" xalign 0.5
            textbutton "${mButtons[1]}" action ShowMenu("load") style "start_menu_button" text_style "start_menu_button_text" xalign 0.5
            textbutton "${mButtons[2]}" action ShowMenu("preferences") style "start_menu_button" text_style "start_menu_button_text" xalign 0.5
            textbutton "${mButtons[3]}" action Quit(confirm=not main_menu) style "start_menu_button" text_style "start_menu_button_text" xalign 0.5
`;
    return rpy;
};