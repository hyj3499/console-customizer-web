// api/renpyScriptConverter.js

// 1. 색상 및 폰트 유틸리티 함수 (screens 변환기와 동일)
const rgbaToHex = (colorStr) => {
    if (!colorStr) return "#ffffff"; 
    if (colorStr.startsWith("#")) return colorStr;
    const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!match) return "#ffffff";
    const r = parseInt(match[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(match[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(match[3], 10).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`; // 대사 텍스트 등은 보통 alpha값 없이 RGB만 사용
};

const safeFont = (fontName) => {
    if (!fontName || fontName === "시스템 폰트 사용" || fontName === "") return "DejaVuSans.ttf";
    if (!fontName.toLowerCase().endsWith(".ttf") && !fontName.toLowerCase().endsWith(".otf")) {
        return `${fontName}.ttf`;
    }
    return fontName;
};

// 2. 스크립트 렌더링 함수
export const generateScriptRpy = (data) => {
    let script = `################################################################################\n`;
    script += `## 캐릭터 및 초기 변수 세팅\n`;
    script += `################################################################################\n\n`;

    // 💡 달력용 변수 선언
    script += `default current_month = ""\n`;
    script += `default current_day = ""\n`;
    script += `default current_time = ""\n\n`;

    // 👤 주인공 캐릭터 정의
    const pName = data.protagonist?.name || '주인공';
    const pColor = rgbaToHex(data.pFontStyle?.color);
    const pFont = safeFont(data.pFontStyle?.font);
    
    // who_color(이름 색상), who_font(이름 폰트), what_color(대사 색상), what_font(대사 폰트)
    script += `define p = Character("${pName}", who_color="${pColor}", what_color="${pColor}", who_font="${pFont}", what_font="${pFont}")\n`;

    // 🎭 등장인물 캐릭터 정의
    if (data.characters && data.characters.length > 0) {
        data.characters.forEach(char => {
            if (char.name) {
                const cColor = rgbaToHex(char.fontStyle?.color);
                const cFont = safeFont(char.fontStyle?.font);
                script += `define char_${char.id} = Character("${char.name}", who_color="${cColor}", what_color="${cColor}", who_font="${cFont}", what_font="${cFont}")\n`;
            }
        });
    }

    script += `\n################################################################################\n`;
    script += `## 메인 스토리 시작점\n`;
    script += `################################################################################\n`;
    script += `label start:\n`;
    
    if (data.events && data.events.length > 0) {
        script += `    jump event_${data.events[0].id}\n\n`;
    } else {
        script += `    "설정된 이벤트가 없습니다."\n    return\n\n`;
    }

    // 🎬 이벤트 파싱 및 라벨 생성
    if (data.events) {
        data.events.forEach(event => {
            const branches = {};
            event.scenarios.forEach(sc => {
                const branchName = sc.branch || 'main';
                if (!branches[branchName]) branches[branchName] = [];
                branches[branchName].push(sc);
            });

            Object.keys(branches).forEach(branch => {
                const labelName = branch === 'main' ? `event_${event.id}` : `event_${event.id}_${branch}`;
                script += `label ${labelName}:\n`;

                // 메인 브랜치에서만 환경 세팅 (배경음악, 달력)
                if (branch === 'main') {
                    if (event.baseDate) {
                        script += `    $ current_month = "${event.baseDate.month || ''}"\n`;
                        script += `    $ current_day = "${event.baseDate.day || ''}"\n`;
                        script += `    $ current_time = "${event.baseDate.time || ''}"\n`;
                    }
                    if (event.bgm) {
                        script += `    play music "${event.bgm}" loop\n`;
                    }
                }

                branches[branch].forEach((sc) => {
                    script += `\n    # [씬 타입: ${sc.type}]\n`;

                    // 배경 처리
                    if (sc.bgImage && sc.bgType === 'custom_cg') {
                        script += `    scene expression "${sc.bgImage}"\n`;
                    } else if (sc.bgType && sc.bgType !== 'custom_cg') {
                        script += `    scene ${sc.bgType}\n`;
                    }

                    // 스탠딩 이미지 (URL 지원)
                    if (sc.protagonistImage) {
                        script += `    show expression "${sc.protagonistImage}" as p_sprite at left\n`;
                    } else {
                        script += `    hide p_sprite\n`;
                    }

                    if (sc.heroineImage) {
                        script += `    show expression "${sc.heroineImage}" as h_sprite at right\n`;
                    } else {
                        script += `    hide h_sprite\n`;
                    }

                    // 대사 처리
                    if (sc.type === 'dialog') {
                        let speakerVar = '""'; 
                        if (sc.speaker === 'PROTAGONIST') {
                            speakerVar = 'p';
                        } else if (sc.speaker !== '나레이션') {
                            const speakerChar = data.characters.find(c => c.name === sc.speaker);
                            speakerVar = speakerChar ? `char_${speakerChar.id}` : `"${sc.speaker}"`;
                        }

                        // 이스케이프 처리 (줄바꿈, 따옴표)
                        const safeText = sc.text ? sc.text.replace(/\n/g, "\\n").replace(/"/g, "\\\"") : "";
                        script += `    ${speakerVar} "${safeText}"\n`;
                    }
                    // 선택지 처리
                    else if (sc.type === 'choice') {
                        script += `    menu:\n`;
                        if (sc.option1) {
                            script += `        "${sc.option1}":\n`;
                            script += `            jump event_${event.id}_option1\n`;
                        }
                        if (sc.option2) {
                            script += `        "${sc.option2}":\n`;
                            script += `            jump event_${event.id}_option2\n`;
                        }
                    }
                    // CG 이미지 강조
                    else if (sc.type === 'cg_image') {
                        if (sc.src) script += `    show expression "${sc.src}" as cg_overlay with dissolve\n`;
                    }
                    // 엔딩 처리
                    else if (sc.type === 'ending') {
                        const safeText = sc.text ? sc.text.replace(/\n/g, "\\n").replace(/"/g, "\\\"") : "";
                        script += `    scene black with dissolve\n`;
                        script += `    centered "{size=+20}${safeText}{/size}"\n`;
                        script += `    return\n`;
                    }
                });

                // 브랜치 흐름 정리
                const lastSc = branches[branch][branches[branch].length - 1];
                if (lastSc && lastSc.type !== 'choice' && lastSc.type !== 'ending') {
                    if (branch === 'main') {
                        const nextEventIndex = data.events.findIndex(e => e.id === event.id) + 1;
                        if (nextEventIndex < data.events.length) {
                            script += `    jump event_${data.events[nextEventIndex].id}\n`;
                        } else {
                            script += `    return\n`;
                        }
                    } else {
                        script += `    return\n`;
                    }
                }
                script += `\n`;
            });
        });
    }

    return script;
};