// api/renpyScriptConverter.js

const getFileName = (path) => {
    if (!path) return "";
    // 문자열인지 객체인지 판단하여 안전하게 파일명 추출
    let pathStr = typeof path === 'object' ? (path.preview || path.url) : path;
    if (!pathStr) return "";
    return pathStr.split('/').pop().split('?')[0];
};

const rgbaToHex = (colorStr) => {
if (!colorStr) return "#ffffff"; 
    if (colorStr.startsWith("#")) return colorStr.length === 7 ? colorStr + "ff" : colorStr;
    const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!match) return "#ffffff";
    const r = parseInt(match[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(match[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(match[3], 10).toString(16).padStart(2, '0');
    
    // ⭐ 투명도(Alpha) 값 계산 복구
    const alpha = match[4] !== undefined ? parseFloat(match[4]) : 1.0;
    const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
    return `#${r}${g}${b}${a}`;
};
const buildCharacterDef = (varName, charName, fontStyle, isProtagonist = false) => {
    const soundFile = fontStyle?.typingSound ? `audio/${fontStyle.typingSound}.ogg` : "audio/type1.ogg";
    const stylePrefix = isProtagonist ? 'p' : varName; 
    
    let charArgs = `callback=lambda event, **kwargs: type_sound_callback(event, sound='${soundFile}', **kwargs), window_style="${stylePrefix}_window", namebox_style="${stylePrefix}_namebox"`;
    
    const textColor = fontStyle?.color ? rgbaToHex(fontStyle.color) : "#ffffff";
    charArgs += `, what_color="${textColor}", who_color="${textColor}"`;
    
    if (fontStyle?.useOutline) {
        const outlineColor = fontStyle.outline ? rgbaToHex(fontStyle.outline) : "#000000";
        charArgs += `, what_outlines=[(2, "${outlineColor}", 0, 0)], who_outlines=[(2, "${outlineColor}", 0, 0)]`;
    }

    return `define ${varName} = Character("${charName}", ${charArgs})\n`;
};

export const generateScriptRpy = (data) => {
    const isBottomMode = data.globalUi?.layoutMode === 'bottom';

    let script = `################################################################################\n`;
    script += `## 1. 전역 설정 및 오디오 로직\n`;
    script += `################################################################################\n`;
    
    // ⭐ 메인 메뉴 BGM 적용 로직
    const bgmPath = data.startMenu?.bgm;
    if (bgmPath && (typeof bgmPath === 'string' || bgmPath.preview)) {
        const bgmName = getFileName(bgmPath);
        if (bgmName) {
            script += `define config.main_menu_music = "audio/${bgmName}"\n\n`;
        }
    }

    script += `init python:\n`;
    script += `    def type_sound_callback(event, sound=None, interact=True, **kwargs):\n`;
    script += `        if not interact: return\n`;
    script += `        if event == "show":\n`;
    script += `            renpy.music.play(sound, channel="sound", loop=True)\n`;
    script += `        elif event == "slow_done" or event == "end":\n`;
    script += `            renpy.music.stop(channel="sound", fadeout=0.1)\n\n`;
    
    script += `################################################################################\n`;
    script += `## 2. 캐릭터 및 화면 변수 선언\n`;
    script += `################################################################################\n\n`;

    script += `default current_month = ""\n`;
    script += `default current_day = ""\n`;
    script += `default current_time = ""\n`;
    script += `default current_p_image = ""\n\n`;

    const pName = data.protagonist?.name || '주인공';
    script += buildCharacterDef("p", pName, data.pFontStyle, true);

    if (data.characters) {
        data.characters.forEach(char => {
            if (char.name) {
                script += buildCharacterDef(`char_${char.id}`, char.name, char.fontStyle, false);
            }
        });
    }

    script += `\n################################################################################\n`;
    script += `## 3. 게임 실행 루프\n`;
    script += `################################################################################\n`;
    script += `label start:\n`;
    
    if (data.events && data.events.length > 0) {
        script += `    jump event_${data.events[0].id}\n\n`;
    }

    if (data.events) {
        data.events.forEach(event => {
            script += `label event_${event.id}:\n`;
            
            if (event.baseDate) {
                script += `    $ current_month = "${event.baseDate.month || ''}"\n`;
                script += `    $ current_day = "${event.baseDate.day || ''}"\n`;
                script += `    $ current_time = "${event.baseDate.time || ''}"\n`;
            }

            event.scenarios.forEach(sc => {
                script += `\n    # 시나리오 타입: [${sc.type}]\n`;
                
                if (sc.dateOverride) {
                    script += `    $ current_month = "${sc.dateOverride.month || ''}"\n`;
                    script += `    $ current_day = "${sc.dateOverride.day || ''}"\n`;
                    script += `    $ current_time = "${sc.dateOverride.time || ''}"\n`;
                }

                if (sc.bgImage) {
                    script += `    scene expression "${getFileName(sc.bgImage)}" with dissolve\n`;
                }
                
                if (sc.protagonistImage) {
                    script += `    $ current_p_image = "${getFileName(sc.protagonistImage)}"\n`;
                } else if (sc.protagonistImage === null && sc.speaker !== '나레이션' && sc.type !== 'cg_image') {
                    script += `    $ current_p_image = ""\n`;
                }
                
                if (sc.heroineImage) {
                    const fileName = getFileName(sc.heroineImage);
                    const standY = isBottomMode ? "76.85" : "100.0"; 
                    const standSize = isBottomMode ? "0.72" : "0.95"; 
                    
                    script += `    show expression "${fileName}" as h_sprite:\n`;
                    script += `        xalign 0.5\n`;
                    if (isBottomMode) {
                        script += `        ypos ${standY} / 100.0\n`;
                        script += `        yanchor 1.0\n`;
                    } else {
                        script += `        yalign 1.0\n`;
                    }
                    script += `        ysize int(config.screen_height * ${standSize})\n`;
                    script += `        fit "contain"\n`;
                }

                if (sc.type === 'dialog') {
                    let speaker = 'p';
                    if (sc.speaker !== 'PROTAGONIST' && sc.speaker !== '나레이션') {
                        const c = data.characters.find(char => char.name === sc.speaker);
                        speaker = c ? `char_${c.id}` : `"${sc.speaker}"`;
                    } else if (sc.speaker === '나레이션') {
                        speaker = '""';
                    }
                    
                    const text = sc.text ? sc.text.replace(/"/g, '\\"') : "";
                    script += `    ${speaker} "${text}"\n`;
                }
            });
            script += `    return\n\n`;
        });
    }

    return script;
};