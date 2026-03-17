/**
 * 렌파이 스크립트 변환기 (최종 수정본)
 * 주요 기능: 타음 오디오 로직, 유동적인 캐릭터 생성, 높이 95% 스탠딩 연출
 */

const getFileName = (path) => {
    if (!path) return "";
    return path.split('/').pop();
};

// 색상 변환 헬퍼 추가 (텍스트 색상 개별 적용을 위함)
// 색상 변환 헬퍼 (Script 파일 상단에 추가 필요)
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

// ⭐ 버그 2 & 3 해결: 개별 외곽선과 이름 텍스트 색상을 확실하게 강제 부여
const buildCharacterDef = (varName, charName, fontStyle, isProtagonist = false) => {
    const soundGroup = fontStyle?.typingSound === 'type2' ? 'sounds_B' : 'sounds_A';
    const stylePrefix = isProtagonist ? 'p' : varName; 
    
    let charArgs = `callback=type_sound_${soundGroup}, window_style="${stylePrefix}_window", namebox_style="${stylePrefix}_namebox"`;
    
    // 텍스트 색상 (what_color: 대사, who_color: 이름)
    const textColor = fontStyle?.color ? rgbaToHex(fontStyle.color) : "#ffffff";
    charArgs += `, what_color="${textColor}", who_color="${textColor}"`;
    
    // 외곽선이 켜져있다면, 대사와 이름 모두에 개별 외곽선 적용
    if (fontStyle?.useOutline) {
        const outlineColor = fontStyle.outline ? rgbaToHex(fontStyle.outline) : "#000000";
        charArgs += `, what_outlines=[(2, "${outlineColor}", 0, 0)], who_outlines=[(2, "${outlineColor}", 0, 0)]`;
    }

    return `define ${varName} = Character("${charName}", ${charArgs})\n`;
};

export const generateScriptRpy = (data) => {
    let script = `################################################################################\n`;
    script += `## 1. 랜덤 타이핑 오디오 로직 (Python 블록)\n`;
    script += `################################################################################\n`;
    
    script += `init python:\n`;
    script += `    import random\n\n`;
    
    script += `    # 오디오 파일 정의\n`;
    script += `    sounds_A = ['audio/A1.ogg', 'audio/A2.ogg', 'audio/A3.ogg', 'audio/A4.ogg', 'audio/A5.ogg']\n`;
    script += `    sounds_B = ['audio/B1.ogg', 'audio/B2.ogg', 'audio/B3.ogg', 'audio/B4.ogg', 'audio/B5.ogg']\n\n`;

    script += `    def type_sound_callback(event, sound_list, interact=True, **kwargs):\n`;
    script += `        if not interact: return\n`;
    script += `        if event == "show":\n`;
    script += `            renpy.sound.play(random.choice(sound_list))\n`;
    script += `            for i in range(15): # 연속적인 소리를 위해 큐 생성\n`;
    script += `                renpy.sound.queue(random.choice(sound_list))\n`;
    script += `        elif event == "slow_done" or event == "end":\n`;
    script += `            renpy.sound.stop()\n\n`;

    script += `    type_sound_sounds_A = lambda event, **kwargs: type_sound_callback(event, sounds_A, **kwargs)\n`;
    script += `    type_sound_sounds_B = lambda event, **kwargs: type_sound_callback(event, sounds_B, **kwargs)\n\n`;

    script += `################################################################################\n`;
    script += `## 2. 전역 변수 및 캐릭터 선언\n`;
    script += `################################################################################\n\n`;

    script += `default current_month = ""\n`;
    script += `default current_day = ""\n`;
    script += `default current_time = ""\n`;
    script += `default current_p_image = ""\n\n`;

    // 주인공 선언
    const pName = data.protagonist?.name || '주인공';
    script += buildCharacterDef("p", pName, data.pFontStyle);

    // 추가 캐릭터 선언
    if (data.characters) {
        data.characters.forEach(char => {
            if (char.name) {
                script += buildCharacterDef(`char_${char.id}`, char.name, char.fontStyle);
            }
        });
    }

    script += `\n################################################################################\n`;
    script += `## 3. 게임 실행 루프\n`;
    script += `################################################################################\n`;
    script += `label start:\n`;
    
    // 첫 번째 이벤트로 자동 시작
    if (data.events && data.events.length > 0) {
        script += `    jump event_${data.events[0].id}\n\n`;
    }

    // 각 이벤트 레이블 생성
    if (data.events) {
        data.events.forEach(event => {
            script += `label event_${event.id}:\n`;
            
            // 상단 UI용 날짜 데이터 갱신
            if (event.baseDate) {
                script += `    $ current_month = "${event.baseDate.month || ''}"\n`;
                script += `    $ current_day = "${event.baseDate.day || ''}"\n`;
                script += `    $ current_time = "${event.baseDate.time || ''}"\n`;
            }

            event.scenarios.forEach(sc => {
                script += `\n    # 시나리오 타입: [${sc.type}]\n`;
                
                // 🖼️ 배경 이미지 설정
                if (sc.bgImage) {
                    script += `    scene expression "${getFileName(sc.bgImage)}" with dissolve\n`;
                }
                
                // 👤 주인공 페이스칩 데이터 갱신 (스크린에서 참조)
                if (sc.protagonistImage) {
                    script += `    $ current_p_image = "${getFileName(sc.protagonistImage)}"\n`;
                }
                
                // 👥 등장인물 스탠딩 이미지 연출 (95% 높이 최적화)
                if (sc.heroineImage) {
                    const fileName = getFileName(sc.heroineImage);
                    script += `    show expression "${fileName}" as h_sprite:\n`;
                    script += `        xalign 0.5\n`;
                    script += `        yalign 1.0\n`;
                    // ⭐ 게임 화면 높이의 95%로 강제 고정하며 비율 유지
                    script += `        ysize int(config.screen_height * 0.95)\n`;
                    script += `        fit "contain"\n`;
                }

                // 💬 대사 출력
                if (sc.type === 'dialog') {
                    let speaker = 'p'; // 기본값 주인공
                    if (sc.speaker !== 'PROTAGONIST' && sc.speaker !== '나레이션') {
                        const c = data.characters.find(char => char.name === sc.speaker);
                        speaker = c ? `char_${c.id}` : `"${sc.speaker}"`;
                    } else if (sc.speaker === '나레이션') {
                        speaker = '""'; // 나레이션은 화자 이름 없음
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