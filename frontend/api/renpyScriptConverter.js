/**
 * 렌파이 스크립트 변환기 (사운드 매핑 수정본)
 * 주요 기능: typingSound 값에 맞는 ogg 파일 루프 재생, 캐릭터별 개별 스타일 적용
 */

const getFileName = (path) => {
    if (!path) return "";
    return path.split('/').pop();
};

const rgbaToHex = (colorStr) => {
    if (!colorStr) return "#ffffff"; 
    if (colorStr.startsWith("#")) return colorStr;
    const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!match) return "#ffffff";
    const r = parseInt(match[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(match[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(match[3], 10).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
};

// ⭐ 캐릭터 정의 생성 (지정된 typingSound 파일 매칭)
const buildCharacterDef = (varName, charName, fontStyle, isProtagonist = false) => {
    // typingSound가 'type2'이면 'audio/type2.ogg'를 사용하도록 설정
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
    let script = `################################################################################\n`;
    script += `## 1. 타이핑 오디오 로직 (음질 최적화 루프 방식)\n`;
    script += `################################################################################\n`;
    
    script += `init python:\n`;
    script += `    def type_sound_callback(event, sound=None, interact=True, **kwargs):\n`;
    script += `        if not interact: return\n`;
    
    script += `        if event == "show":\n`;
    script += `            # renpy.music.play를 'sound' 채널에서 실행하면 \n`;
    script += `            # sound.play보다 훨씬 부드럽고 끊김 없는 무한 루프가 가능합니다.\n`;
    script += `            renpy.music.play(sound, channel="sound", loop=True)\n`;
    
    script += `        elif event == "slow_done" or event == "end":\n`;
    script += `            # 소리가 갑자기 툭 끊기는 것을 방지하기 위해 0.1초 페이드아웃을 줍니다.\n`;
    script += `            renpy.music.stop(channel="sound", fadeout=0.1)\n\n`;
    script += `################################################################################\n`;
    script += `## 2. 전역 변수 및 캐릭터 선언\n`;
    script += `################################################################################\n\n`;

    script += `default current_month = ""\n`;
    script += `default current_day = ""\n`;
    script += `default current_time = ""\n`;
    script += `default current_p_image = ""\n\n`;

    // 주인공 선언
    const pName = data.protagonist?.name || '주인공';
    script += buildCharacterDef("p", pName, data.pFontStyle, true);

    // 추가 캐릭터 선언
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
                
                if (sc.bgImage) {
                    script += `    scene expression "${getFileName(sc.bgImage)}" with dissolve\n`;
                }
                
                if (sc.protagonistImage) {
                    script += `    $ current_p_image = "${getFileName(sc.protagonistImage)}"\n`;
                }
                
                if (sc.heroineImage) {
                    const fileName = getFileName(sc.heroineImage);
                    script += `    show expression "${fileName}" as h_sprite:\n`;
                    script += `        xalign 0.5\n`;
                    script += `        yalign 1.0\n`;
                    script += `        ysize int(config.screen_height * 0.95)\n`;
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