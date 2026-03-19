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
    const sysFontName = safeFont(data.globalUi?.systemFont || "Galmuri14"); // ⭐ 엔딩에 쓰일 폰트 추출

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

                if (labelName === `event_${event.id}` && event.baseDate) {
                    out += `    $ current_month = "${event.baseDate.month || ''}"\n`;
                    out += `    $ current_day = "${event.baseDate.day || ''}"\n`;
                    out += `    $ current_time = "${event.baseDate.time || ''}"\n`;
                }

                scenarioList.forEach((sc, sIdx) => {
                    out += `\n    # 컷 ${sIdx + 1} [${sc.type}]\n`;

                    if (sc.dateOverride) {
                        out += `    $ current_month = "${sc.dateOverride.month || ''}"\n`;
                        out += `    $ current_day = "${sc.dateOverride.day || ''}"\n`;
                        out += `    $ current_time = "${sc.dateOverride.time || ''}"\n`;
                    }

                    // ⭐ 수정 3. 엔딩 텍스트를 시스템 폰트와 함께 한가운데에 고정 (truecenter)
                    if (sc.type === 'ending') {
                        out += `    window hide\n`;
                        out += `    scene black with dissolve\n`;
                        out += `    show text "{font=${sysFontName}}{size=50}${sc.text || ''}{/size}{/font}" at truecenter\n`;
                        out += `    with dissolve\n`;
                        out += `    pause\n`; // 플레이어가 클릭할 때까지 대기
                        out += `    return\n`; 
                        return;
                    }

                    if (sc.type === 'choice') {
                        const opt1Text = sc.option1 || "선택지 1";
                        const opt2Text = sc.option2 || "선택지 2";
                        out += `    menu:\n`;
                        out += `        "${opt1Text}":\n`;
                        out += `            jump event_${event.id}_opt1\n`;
                        out += `        "${opt2Text}":\n`;
                        out += `            jump event_${event.id}_opt2\n`;
                        return;
                    }

                    // ⭐ 수정 2. CG 일러스트 화면 꽉 차게 변경 (1920x1080 비율 커버)
if (sc.type === 'cg_image') {
                        const cgName = getFileName(sc.src);
                        if (cgName && s.bg !== cgName) {
                            // align=(0.5, 0.5)를 추가하여 웹의 object-fit: cover처럼 중앙 정렬 자르기 구현
                            out += `    scene expression Transform("${cgName}", xysize=(1920, 1080), fit="cover", align=(0.5, 0.5)) with dissolve\n`;
                            s.bg = cgName;
                        }
                        out += `    hide h_sprite\n`;
                        out += `    $ current_p_image = ""\n`;
                        s.h = ""; s.p = "";
                        return;
                    }

                    if (sc.type === 'dialog') {
                        // ⭐ [수정] 일반 배경 출력 로직도 동일하게 처리
                        const bgName = getFileName(sc.bgImage);
                        if (bgName && bgName !== s.bg) {
                            out += `    scene expression Transform("${bgName}", xysize=(1920, 1080), fit="cover", align=(0.5, 0.5)) with dissolve\n`;
                            s.bg = bgName;
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
                            speaker = '""';
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