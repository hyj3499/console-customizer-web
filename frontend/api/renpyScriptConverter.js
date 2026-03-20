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
    // ⭐ 추가: 2. 나레이션 전용 객체 생성 (이름은 없고 주인공 스타일만 빌려옴)
    script += buildCharacterDef("narration", null, data.pFontStyle, true);

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

            const mainScen = event.scenarios.filter(s => s.branch === 'main' || s.type === 'choice');
            const opt1Scen = event.scenarios.filter(s => s.branch === 'option1');
            const opt2Scen = event.scenarios.filter(s => s.branch === 'option2');

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

                    if (sc.type === 'choice') {
                        const opt1Text = sc.option1 || "선택지 1";
                        const opt2Text = sc.option2 || "선택지 2";
                        // ⭐ 렌파이 기본 menu 명령어는 화면 정중앙에 버튼들을 출력합니다.
                        out += `    menu:\n`;
                        out += `        "${opt1Text}":\n`;
                        out += `            jump event_${event.id}_opt1\n`;
                        out += `        "${opt2Text}":\n`;
                        out += `            jump event_${event.id}_opt2\n`;
                        return;
                    }

                    // ⭐ 수정: CG 이미지 출력부
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
                        
                        // ⭐ 추가: 달력 숨김 플래그 ON
                        out += `    $ show_calendar = False\n`;

                        if (transitionNeeded || sIdx === 0) {
                            out += `    with ${transType}\n`;
                        }

                        // ⭐ 추가: 이미지를 보여준 상태에서 클릭 대기 (대사창 뜨기 전 딜레이)
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

                        // ⭐ 달력 제어: CG 연출이면 달력을 끄고, 일반 대화면 달력을 켭니다.
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
                            // ⭐ 수정: 위에서 선언한 나레이션 전용 화자로 지정
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
            
            const mainRes = renderBlock(`event_${event.id}`, mainScen, curState);
            script += mainRes.out;

            if (opt1Scen.length > 0) {
                const opt1Res = renderBlock(`event_${event.id}_opt1`, opt1Scen, mainRes.stateOut);
                script += opt1Res.out;
            }
            
            if (opt2Scen.length > 0) {
                const opt2Res = renderBlock(`event_${event.id}_opt2`, opt2Scen, mainRes.stateOut);
                script += opt2Res.out;
            }
        });
    }

    return script;
};