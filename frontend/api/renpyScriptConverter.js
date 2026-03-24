// api/renpyScriptConverter.js

const getFileName = (path) => {
    if (!path) return "";
    let pathStr = typeof path === 'object' ? (path.preview || path.url) : path;
    if (!pathStr) return "";
    let fileName = pathStr.split('/').pop().split('?')[0];
    try { return decodeURIComponent(fileName); } catch (e) { return fileName; }
};

const safeFont = (fontName) => {
    if (!fontName || fontName === "시스템 폰트 사용" || fontName === "") return "DejaVuSans.ttf";
    if (!fontName.toLowerCase().endsWith(".ttf") && !fontName.toLowerCase().endsWith(".otf")) return `${fontName}.ttf`;
    return fontName;
};

const rgbaToHex = (colorStr) => {
    if (!colorStr) return "#ffffff"; 
    if (colorStr.startsWith("#")) return colorStr.length === 7 ? colorStr + "ff" : colorStr;
    const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!match) return "#ffffff";
    const r = parseInt(match[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(match[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(match[3], 10).toString(16).padStart(2, '0');
    
    const alpha = match[4] !== undefined ? parseFloat(match[4]) : 1.0;
    const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
    return `#${r}${g}${b}${a}`;
};

// ⭐ 수정: charName이 없으면(null) 네임박스를 끄고 나레이션 모드로 생성하도록 개선
const buildCharacterDef = (varName, charName, fontStyle, isProtagonist = false) => {
    const soundFile = fontStyle?.typingSound ? `audio/${fontStyle.typingSound}.ogg` : "audio/type1.ogg";
    const stylePrefix = isProtagonist ? 'p' : varName; 
    
    let charArgs = `callback=lambda event, **kwargs: type_sound_callback(event, sound='${soundFile}', **kwargs), window_style="${stylePrefix}_window"`;
    
    if (charName) {
        charArgs += `, namebox_style="${stylePrefix}_namebox"`;
    }
    
    const textColor = fontStyle?.color ? rgbaToHex(fontStyle.color) : "#ffffff";
    charArgs += `, what_color="${textColor}"`;
    
    if (charName) {
        charArgs += `, who_color="${textColor}"`;
    }
    
    if (fontStyle?.useOutline) {
        const outlineColor = fontStyle.outline ? rgbaToHex(fontStyle.outline) : "#000000";
        charArgs += `, what_outlines=[(2, "${outlineColor}", 0, 0)]`;
        if (charName) {
            charArgs += `, who_outlines=[(2, "${outlineColor}", 0, 0)]`;
        }
    }

    const nameArg = charName ? `"${charName}"` : "None";
    return `define ${varName} = Character(${nameArg}, ${charArgs})\n`;
};

export const generateScriptRpy = (data) => {
    const isBottomMode = data.globalUi?.layoutMode === 'bottom';
    const sysFontName = safeFont(data.globalUi?.systemFont || "Galmuri14");

    let script = `################################################################################\n`;
    script += `## 1. 전역 설정 및 오디오 로직\n`;
    script += `################################################################################\n`;
    
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
    script += `default current_p_image = ""\n`;
    // ⭐ 추가: 달력 표시 여부를 결정하는 전역 플래그
    script += `default show_calendar = True\n\n`;

const pName = data.protagonist?.name || '주인공';
    // 1. 주인공 생성
    script += buildCharacterDef("p", pName, data.pFontStyle, true);
    
    // ⭐ 수정: 2. 나레이션 전용 객체 생성 (이제 스토어의 나레이션 전용 스타일 사용)
    // 과거 저장 데이터와의 호환성을 위해 || data.pFontStyle 안전 장치 추가
    const safeNarrationStyle = data.narrationFontStyle || data.pFontStyle;
    
    // 마지막 인자를 false로 주어 'p_window'가 아닌 'narration_window' 스타일을 참조하게 함
    script += buildCharacterDef("narration", null, safeNarrationStyle, false);
    if (data.characters) {
        data.characters.forEach(char => {
            if (char.name) {
                script += buildCharacterDef(`char_${char.id}`, char.name, char.fontStyle, false);
            }
        });
    }

    script += `\n################################################################################\n`;
    script += `## 3. 게임 실행 루프 (선택지 및 분기 자동 처리)\n`;
    script += `################################################################################\n`;
    script += `label start:\n`;
    
    if (data.events && data.events.length > 0) {
        script += `    jump event_${data.events[0].id}\n\n`;
    }

if (data.events) {
        data.events.forEach((event, idx) => {
            const nextEvent = data.events[idx + 1];
            const nextEventLabel = nextEvent ? `event_${nextEvent.id}` : null;

            // 메인 루트만 먼저 추출 (opt1Scen, opt2Scen 등 하드코딩 삭제)
            const mainScen = event.scenarios.filter(s => s.branch === 'main' || s.type === 'choice');

            const renderBlock = (labelName, scenarioList, stateIn) => {
                if (scenarioList.length === 0) return { out: "", stateOut: stateIn };
                
                let out = `label ${labelName}:\n`;
                let s = { ...stateIn }; 

                if (labelName === `event_${event.id}`) {
                    if (event.bgm) {
                        const eventBgmName = getFileName(event.bgm);
                        if (eventBgmName) {
                            out += `    play music "audio/${eventBgmName}" fadein 1.0\n`;
                        }
                    }

                    if (event.baseDate) {
                        out += `    $ current_month = "${event.baseDate.month || ''}"\n`;
                        out += `    $ current_day = "${event.baseDate.day || ''}"\n`;
                        out += `    $ current_time = "${event.baseDate.time || ''}"\n`;
                    }
                }

                scenarioList.forEach((sc, sIdx) => {
                    out += `\n    # 컷 ${sIdx + 1} [${sc.type}]\n`;

                    if (sc.dateOverride) {
                        out += `    $ current_month = "${sc.dateOverride.month || ''}"\n`;
                        out += `    $ current_day = "${sc.dateOverride.day || ''}"\n`;
                        out += `    $ current_time = "${sc.dateOverride.time || ''}"\n`;
                    }

                    if (sc.type === 'ending') {
                        out += `    window hide\n`;
                        out += `    scene black with dissolve\n`;
                        out += `    show text "{font=${sysFontName}}{size=50}${sc.text || ''}{/size}{/font}" at truecenter\n`;
                        out += `    with dissolve\n`;
                        out += `    pause\n`; 
                        out += `    return\n`; 
                        return;
                    }

                    // ⭐ 수정됨: options 배열만 사용해서 1~10개 선택지 깔끔하게 생성
                    if (sc.type === 'choice') {
                        out += `    menu:\n`;
                        (sc.options || []).forEach((optText, optIdx) => {
                            const finalOptText = optText.trim() || `선택지 ${optIdx + 1}`;
                            out += `        "${finalOptText.replace(/"/g, '\\"')}":\n`;
                            out += `            jump event_${event.id}_option${optIdx + 1}\n`;
                        });
                        return;
                    }

                    if (sc.type === 'cg_image') {
                        const cgName = getFileName(sc.src);
                        let transitionNeeded = false;
                        let transType = (sIdx === 0) ? "Dissolve(1.5)" : "dissolve";

                        if (cgName && s.bg !== cgName) {
                            out += `    scene expression Transform("${cgName}", xysize=(1920, 1080), fit="cover", align=(0.5, 0.5))\n`;
                            s.bg = cgName;
                            transitionNeeded = true;
                        }
                        if (s.h !== "") {
                            out += `    hide h_sprite\n`;
                            s.h = "";
                            transitionNeeded = true;
                        }
                        
                        out += `    $ show_calendar = False\n`;

                        if (transitionNeeded || sIdx === 0) {
                            out += `    with ${transType}\n`;
                        }

                        out += `    pause\n`;

                        out += `    $ current_p_image = ""\n`;
                        s.p = "";
                        return;
                    }

                    if (sc.type === 'dialog') {
                        let transitionNeeded = false;
                        let transType = (sIdx === 0) ? "Dissolve(1.5)" : "dissolve";

                        const bgName = getFileName(sc.bgImage);
                        if (bgName && bgName !== s.bg) {
                            out += `    scene expression Transform("${bgName}", xysize=(1920, 1080), fit="cover", align=(0.5, 0.5))\n`;
                            s.bg = bgName;
                            transitionNeeded = true;
                        }

                        const hName = sc.heroineImage === null ? "" : getFileName(sc.heroineImage);
                        if (hName !== s.h) {
                            if (hName === "") {
                                out += `    hide h_sprite\n`;
                            } else {
                                const standY = isBottomMode ? "76.85" : "100.0"; 
                                const standSize = isBottomMode ? "0.72" : "0.95"; 
                                out += `    show expression "${hName}" as h_sprite:\n`;
                                out += `        xalign 0.5\n`;
                                if (isBottomMode) {
                                    out += `        ypos ${standY} / 100.0\n`;
                                    out += `        yanchor 1.0\n`;
                                } else {
                                    out += `        yalign 1.0\n`;
                                }
                                out += `        ysize int(config.screen_height * ${standSize})\n`;
                                out += `        fit "contain"\n`;
                            }
                            s.h = hName;
                            transitionNeeded = true;
                        }

                        if (sc.isCg) {
                            out += `    $ show_calendar = False\n`;
                        } else {
                            out += `    $ show_calendar = True\n`;
                        }

                        if (transitionNeeded || sIdx === 0) {
                            out += `    with ${transType}\n`;
                        }

                        const pName = sc.protagonistImage === null ? "" : getFileName(sc.protagonistImage);
                        if (pName !== s.p) {
                            out += `    $ current_p_image = "${pName}"\n`;
                            s.p = pName;
                        }

                        let speaker = 'p';
                        if (sc.speaker === 'PROTAGONIST') {
                            speaker = 'p';
                        } else if (sc.speaker === '나레이션') {
                            speaker = 'narration';
                        } else {
                            const c = data.characters.find(char => char.name === sc.speaker);
                            speaker = c ? `char_${c.id}` : `"${sc.speaker}"`;
                        }

                        const text = sc.text ? sc.text.replace(/"/g, '\\"') : "";
                        out += `    ${speaker} "${text}"\n`;
                    }
                });

                const lastSc = scenarioList[scenarioList.length - 1];
                if (lastSc && lastSc.type !== 'ending' && lastSc.type !== 'choice') {
                    if (nextEventLabel) {
                        out += `    window hide\n`;                  
                        out += `    scene black\n`;                
                        out += `    with Dissolve(1.5)\n`;          
                        out += `    pause 0.5\n`;                    
                        out += `    jump ${nextEventLabel}\n\n`;      
                    } else {
                        out += `    return\n\n`;
                    }
                }
                return { out, stateOut: s };
            };

            let curState = { bg: "", p: "", h: "" };
            
            // 메인 루트 생성
            const mainRes = renderBlock(`event_${event.id}`, mainScen, curState);
            script += mainRes.out;

            // ⭐ 수정됨: 1번부터 10번까지 루프를 돌면서 존재하는 옵션(optionN) 루트들을 모두 렌더링
            for (let i = 1; i <= 10; i++) {
                const branchName = `option${i}`;
                const optScen = event.scenarios.filter(s => s.branch === branchName);
                
                if (optScen.length > 0) {
                    const optRes = renderBlock(`event_${event.id}_${branchName}`, optScen, mainRes.stateOut);
                    script += optRes.out;
                }
            }
        });
    }

    return script;
};