// api/renpyScreensConverter.js

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

/**
 * ⭐ 핵심 로직: 둥근 모서리 제거 및 투명도 완벽 보존형 이중 테두리 조립
 */
const getBgStr = (frameType, bgColorVal, borderColorVal, useBorder, isNamebox) => {
    const w = isNamebox ? 180 : 1100;
    const h = isNamebox ? 50 : 250;

    // 1. 레트로(도트) 모드
    if (frameType === 'retro') {
        const size = isNamebox ? 50 : 150;
        const prefix = isNamebox ? 'namebox' : 'dialog';
        return `Frame("images/retro_${prefix}_${getColorId(bgColorVal)}.png", ${size}, ${size}, tile=False)`;
    }

    const bgColorHex = rgbaToHex(bgColorVal); 
    const bdColorHex = rgbaToHex(borderColorVal || '#dddddd');

    // 테두리 미사용 시: 단일 투명 배경만 반환
    if (!useBorder) {
        return `Transform(Solid("${bgColorHex}"), xysize=(${w}, ${h}))`;
    }

    /**
     * 2. 고딕풍 (이중 테두리 로직)
     * 테두리가 중앙을 가리지 않도록 얇은 선 4개를 조립하여 액자를 만들고,
     * 그 안에 조금 더 작은 액자를 하나 더 넣은 뒤, 마지막에 투명 배경을 꽂습니다.
     */
if (frameType === 'gothic') {
        const line1 = 1; // 바깥쪽 선 두께
        const gap = 2;   // 선 사이 간격
        const line2 = 1; // 안쪽 선 두께
        const totalBw = line1 + gap + line2; 

        const innerW = w - (totalBw * 2);
        const innerH = h - (totalBw * 2);

        return `Composite((${w}, ${h}),
            # 1. 바깥쪽 테두리 액자
            (0, 0), Transform(Solid("${bdColorHex}"), xysize=(${w}, ${line1})),
            (0, ${h - line1}), Transform(Solid("${bdColorHex}"), xysize=(${w}, ${line1})),
            (0, ${line1}), Transform(Solid("${bdColorHex}"), xysize=(${line1}, ${h - line1 * 2})),
            (${w - line1}, ${line1}), Transform(Solid("${bdColorHex}"), xysize=(${line1}, ${h - line1 * 2})),
            
            # 2. ⭐ 선 사이 간격(Gap) 채우기
            # 테두리 사이의 비어있는 공간을 배경색(bgColorHex)으로 미리 채워줍니다.
            (${line1}, ${line1}), Transform(Solid("${bgColorHex}"), xysize=(${w - line1 * 2}, ${gap})),
            (${line1}, ${h - line1 - gap}), Transform(Solid("${bgColorHex}"), xysize=(${w - line1 * 2}, ${gap})),
            (${line1}, ${line1 + gap}), Transform(Solid("${bgColorHex}"), xysize=(${gap}, ${h - (line1 + gap) * 2})),
            (${w - line1 - gap}, ${line1 + gap}), Transform(Solid("${bgColorHex}"), xysize=(${gap}, ${h - (line1 + gap) * 2})),

            # 3. 안쪽 테두리 액자 (gap만큼 띄우고 배치)
            (${line1 + gap}, ${line1 + gap}), Transform(Solid("${bdColorHex}"), xysize=(${w - (line1 + gap) * 2}, ${line2})),
            (${line1 + gap}, ${h - (line1 + gap) - line2}), Transform(Solid("${bdColorHex}"), xysize=(${w - (line1 + gap) * 2}, ${line2})),
            (${line1 + gap}, ${line1 + gap + line2}), Transform(Solid("${bdColorHex}"), xysize=(${line2}, ${h - (line1 + gap + line2) * 2})),
            (${w - (line1 + gap) - line2}, ${line1 + gap + line2}), Transform(Solid("${bdColorHex}"), xysize=(${line2}, ${h - (line1 + gap + line2) * 2})),
            
            # 4. 중앙 투명 배경
            (${totalBw}, ${totalBw}), Transform(Solid("${bgColorHex}"), xysize=(${innerW}, ${innerH}))
        )`;
    }
    /**
     * 3. 심플형/큐티형 (단일 테두리 로직)
     */
    let bw = (frameType === 'cute') ? 3 : 2;
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
    const pStyle = data.pFontStyle || {};
    const ui = data.globalUi || {};
    const start = data.startMenu || {};

    const mainFont = safeFont(pStyle.font || ui.systemFont);
    const mainColor = rgbaToHex(pStyle.color);
    
    // 초상화 배경용 (액자 조립 방식 적용)
    const getPortraitBgStr = () => {
        if (pStyle.portraitStyle === 'retro') {
            return `Transform("images/retro_frame_${getColorId(pStyle.portraitColor)}.png", xysize=(250, 250))`;
        }
        const bgColorHex = rgbaToHex(pStyle.portraitColor);
        const bdColorHex = rgbaToHex(pStyle.portraitBorderColor || '#dddddd');
        const bw = 3;
        const size = 250;
        const inner = size - (bw * 2);
        
        return `Composite((${size}, ${size}), 
            (0, 0), Transform(Solid("${bdColorHex}"), xysize=(${size}, ${bw})), 
            (0, ${size - bw}), Transform(Solid("${bdColorHex}"), xysize=(${size}, ${bw})), 
            (0, ${bw}), Transform(Solid("${bdColorHex}"), xysize=(${bw}, ${inner})), 
            (${size - bw}, ${bw}), Transform(Solid("${bdColorHex}"), xysize=(${bw}, ${inner})), 
            (${bw}, ${bw}), Transform(Solid("${bgColorHex}"), xysize=(${inner}, ${inner})))`;
    };

    const calBgStr = ui.calendarFrame === 'retro'
        ? `Transform("images/retro_calendar_${getColorId(ui.calendarColor)}.png", xysize=(150, 150))`
        : `Solid("${rgbaToHex(ui.calendarColor)}")`;

    const calText = rgbaToHex(ui.calendarTextColor);
    const calLine = rgbaToHex(ui.calendarTextOutlineColor);
    const startBgUrl = start.bgImage || "background/bg_title.png";
    const menuX = (start.menuPos?.x || 50) / 100;
    const menuY = (start.menuPos?.y || 70) / 100;
    const titleSize = start.textStyle?.fontSize || 40;

    let rpy = `
################################################################################
## 커스텀 스크린 오버라이드
################################################################################
init offset = 1

style default:
    font "${mainFont}"
    size 30
    color "${mainColor}"

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
    size 30 
    bold True
    yalign 0.5
    xalign 0.5

style say_dialogue:
    font "${mainFont}"
    size 30
    line_spacing 5
    adjust_spacing False

################################################################################
## 🎨 캐릭터별 전용 스타일 동적 생성
################################################################################
style p_window is say_window:
    background ${getBgStr(pStyle.dialogFrame, pStyle.dialogColor, pStyle.dialogBorderColor, pStyle.useDialogBorder !== false, false)}
style p_namebox is say_namebox:
    background ${getBgStr(pStyle.nameFrame, pStyle.nameColor, pStyle.nameBorderColor, pStyle.useNameBorder !== false, true)}
`;

    if (data.characters) {
        data.characters.forEach(char => {
            const cStyle = char.fontStyle || {};
            rpy += `
style char_${char.id}_window is say_window:
    background ${getBgStr(cStyle.dialogFrame, cStyle.dialogColor, cStyle.dialogBorderColor, cStyle.useDialogBorder !== false, false)}
style char_${char.id}_namebox is say_namebox:
    background ${getBgStr(cStyle.nameFrame, cStyle.nameColor, cStyle.nameBorderColor, cStyle.useNameBorder !== false, true)}
`;
        });
    }

    rpy += `
################################################################################
## 인게임 스크린 (Say)
################################################################################
screen say(who, what):
    $ ui_x = 250          
    $ ui_y = 780          
    $ face_size = 250      
    $ gap = 30             
    $ tb_w = 1100          
    $ tb_h = 250           
    $ namebox_w = 180      
    $ namebox_h = 50       
    $ namebox_gap = 10     
    $ cal_size = 150       
    $ top_y = 50           
    $ box_x = ui_x + face_size + gap 

    if "${ui.calendarFrame}" != "none":
        hbox:
            xpos ui_x
            ypos top_y
            spacing 25
            fixed:
                xysize (cal_size, cal_size)
                add ${calBgStr}
                text "[current_day]":
                    align (0.5, 0.7)  
                    size 65            
                    color "${calText}"
                    ${ui.calendarTextUseOutline ? `outlines [(2, "${calLine}")]` : ""}
            vbox:
                yalign 0.5
                spacing 15
                text "[current_month]":
                    size 38
                    color "${calText}"
                    ${ui.calendarTextUseOutline ? `outlines [(2, "${calLine}")]` : ""}
                text "[current_time]":
                    size 38
                    color "${calText}"
                    ${ui.calendarTextUseOutline ? `outlines [(2, "${calLine}")]` : ""}

    if getattr(store, "current_p_image", "") != "":
        fixed:
            xpos ui_x
            ypos ui_y
            xysize (face_size, face_size)
            add ${getPortraitBgStr()}
            add AlphaMask(
                Transform(getattr(store, "current_p_image", ""), xysize=(face_size, face_size), fit="cover"),
                Transform("images/retro_frame_mask.png", xysize=(face_size, face_size))
            ) align(0.5, 0.5)

    window:
        id "window"
        xpos box_x          
        ypos ui_y          
        xsize tb_w         
        ysize tb_h         
        
        text what id "what":
            xpos 30       
            ypos 30       
            xsize (tb_w - 70) 

    if who is not None:
        window:
            id "namebox"
            xpos box_x          
            ypos ui_y - namebox_h - namebox_gap 
            xysize (namebox_w, namebox_h)   
            text who id "who" align (0.5, 0.5)

screen main_menu():
    tag menu
    add "${startBgUrl}" xysize (1920, 1080) fit "cover"
    vbox:
        align (${menuX}, ${menuY})
        spacing 20
        textbutton "PLAY" action Start() text_size ${titleSize}
        textbutton "LOAD" action ShowMenu("load") text_size ${titleSize}
        textbutton "SETTING" action ShowMenu("preferences") text_size ${titleSize}
        textbutton "EXIT" action Quit(confirm=not main_menu) text_size ${titleSize}
`;
    return rpy;
};