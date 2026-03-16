// api/renpyScreensConverter.js

// 1. 렌파이 전용 색상 변환기 (rgba -> #RRGGBBAA)
const rgbaToHex = (colorStr) => {
    if (!colorStr) return "#ffffff"; 
    if (colorStr.startsWith("#")) return colorStr;
    const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!match) return "#ffffff";
    const r = parseInt(match[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(match[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(match[3], 10).toString(16).padStart(2, '0');
    const a = match[4] !== undefined 
        ? Math.round(parseFloat(match[4]) * 255).toString(16).padStart(2, '0') 
        : 'ff';
    return `#${r}${g}${b}${a}`;
};

// 2. ⭐ 폰트 파일명 처리기 (가장 중요한 수정 부분)
const safeFont = (fontName) => {
    // 폰트 설정이 없거나 시스템 폰트면 기본값 반환
    if (!fontName || fontName === "시스템 폰트 사용" || fontName === "") return "DejaVuSans.ttf";
    
    // 렌파이는 파일명을 정확히 요구합니다. (Galmuri14 -> Galmuri14.ttf)
    // 만약 확장자가 없다면 .ttf를 강제로 붙여줍니다.
    if (!fontName.toLowerCase().endsWith(".ttf") && !fontName.toLowerCase().endsWith(".otf")) {
        return `${fontName}.ttf`;
    }
    return fontName;
};

export const generateScreensRpy = (data) => {
    const pStyle = data.pFontStyle || {};
    const ui = data.globalUi || {};
    const start = data.startMenu || {};

    const mainFont = safeFont(pStyle.font || ui.systemFont);
    const mainColor = rgbaToHex(pStyle.color);
    const outlineColor = rgbaToHex(pStyle.outline);
    const textboxBg = rgbaToHex(pStyle.dialogColor || "rgba(0,0,0,0.8)");
    const nameboxBg = rgbaToHex(pStyle.nameColor || "rgba(255,182,193,0.8)");
    
    const calBg = rgbaToHex(ui.calendarColor);
    const calText = rgbaToHex(ui.calendarTextColor);
    const calLine = rgbaToHex(ui.calendarTextOutlineColor);

    const startBgUrl = start.bgImage || "background/bg_title.png";
    const menuX = (start.menuPos?.x || 50) / 100;
    const menuY = (start.menuPos?.y || 70) / 100;
    const titleSize = start.textStyle?.fontSize || 40;

    return `
################################################################################
## 초기화
################################################################################
init offset = -1

################################################################################
## 스타일 정의 (Zustand 데이터 반영)
################################################################################
style default:
    font "${mainFont}"
    size 30
    color "${mainColor}"
    ${pStyle.useOutline ? `outlines [(2, "${outlineColor}", 0, 0)]` : ""}

style window:
    xalign 0.5
    xfill True
    yalign 1.0
    ysize 250
    background Solid("${textboxBg}") 

style namebox:
    xpos 250
    xanchor 0.0
    xsize 200
    ypos -10 
    ysize 50
    background Solid("${nameboxBg}")
    padding (10, 5, 10, 5)

style say_label:
    font "${mainFont}"
    size 24
    color "${mainColor}"
    bold True

style say_dialogue:
    font "${mainFont}"
    size 28
    xpos 30
    ypos 20
    line_spacing 5

################################################################################
## 인게임 스크린 (Say)
################################################################################
screen say(who, what):
    style_prefix "say"
    window:
        id "window"
        if who is not None:
            window:
                id "namebox"
                style "namebox"
                text who id "who"
        text what id "what"

    if "${ui.calendarFrame}" != "none":
        hbox:
            xpos 100
            ypos 50
            spacing 20
            fixed:
                xysize (120, 120)
                add Solid("${calBg}")
                text "[current_day]":
                    align (0.5, 0.5)
                    size 40
                    color "${calText}"
                    ${ui.calendarTextUseOutline ? `outlines [(2, "${calLine}")]` : ""}
            vbox:
                yalign 0.5
                text "[current_month]":
                    size 26
                    color "${calText}"
                    ${ui.calendarTextUseOutline ? `outlines [(1, "${calLine}")]` : ""}
                text "[current_time]":
                    size 22
                    color "${calText}"
                    ${ui.calendarTextUseOutline ? `outlines [(1, "${calLine}")]` : ""}

    if SideImage() is not None:
        add SideImage() xalign 0.0 yalign 1.0

################################################################################
## 메인 메뉴
################################################################################
screen main_menu():
    tag menu
    add "${startBgUrl}" xysize (1920, 1080) fit "cover"
    vbox:
        align (${menuX}, ${menuY})
        spacing 20
        textbutton _("새 게임") action Start() text_size ${titleSize}
        textbutton _("불러오기") action ShowMenu("load") text_size ${titleSize}
        textbutton _("설정") action ShowMenu("preferences") text_size ${titleSize}
        textbutton _("종료") action Quit(confirm=not main_menu) text_size ${titleSize}

################################################################################
## 기타 필수 시스템 스크린
################################################################################
screen input(prompt):
    style_prefix "input"
    window:
        vbox:
            xanchor 0.0
            xpos 30
            text prompt
            input id "input"

screen choice(items):
    style_prefix "choice"
    vbox:
        for i in items:
            textbutton i.caption action i.action

style choice_vbox:
    xalign 0.5
    ypos 400
    yanchor 0.5
    spacing 15

style choice_button is default:
    background Solid("#000000aa")
    padding (20, 10)
    xminimum 400

style choice_button_text is default:
    xalign 0.5
    hover_color "#ff6b6b"

screen quick_menu():
    zorder 100
    if quick_menu:
        hbox:
            style_prefix "quick"
            xalign 0.5
            yalign 1.0
            textbutton _("Back") action Rollback()
            textbutton _("Save") action ShowMenu('save')
            textbutton _("Prefs") action ShowMenu('preferences')

screen navigation():
    vbox:
        xpos 50
        yalign 0.5
        spacing 20
        textbutton _("Start") action Start()
        textbutton _("Load") action ShowMenu("load")
        textbutton _("Preferences") action ShowMenu("preferences")
        textbutton _("Quit") action Quit(confirm=not main_menu)

screen game_menu(title, scroll=None, yinitial=0.0, spacing=0):
    style_prefix "game_menu"
    add Solid("#000000cc")
    frame:
        xfill True
        yfill True
        transclude
    use navigation
    textbutton _("Return") action Return() align (0.9, 0.9)

screen file_slots(title):
    use game_menu(title):
        fixed:
            text "Save/Load slots will appear here" align (0.5, 0.5)

screen save():
    tag menu
    use file_slots(_("Save"))

screen load():
    tag menu
    use file_slots(_("Load"))

screen preferences():
    tag menu
    use game_menu(_("Preferences")):
        vbox:
            label _("Text Speed")
            bar value Preference("text speed")

screen history():
    tag menu
    use game_menu(_("History")):
        vbox:
            label _("Dialogue History")

screen about():
    tag menu
    use game_menu(_("About")):
        vbox:
            label "[config.name!t]"
            text "Version [config.version]"

screen help():
    tag menu
    use game_menu(_("Help")):
        label _("Help content here")

screen confirm(message, yes_action, no_action):
    modal True
    zorder 200
    add Solid("#000000aa")
    frame:
        align (0.5, 0.5)
        padding (40, 40)
        vbox:
            spacing 30
            label _(message) xalign 0.5
            hbox:
                spacing 100
                xalign 0.5
                textbutton _("Yes") action yes_action
                textbutton _("No") action no_action

screen skip_indicator():
    zorder 100
    text "Skipping..." align (0.9, 0.1)

screen notify(message):
    zorder 100
    text "[message!tq]" align (0.1, 0.1)

screen nvl(dialogue, items=None):
    window:
        style "nvl_window"
        vbox:
            for d in dialogue:
                text d.what
`;
};