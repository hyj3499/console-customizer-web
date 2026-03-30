// api/renpyScriptConverter.js

const getFileName = (path) => {
    if (!path) return "";
    let pathStr = typeof path === 'object' ? (path.preview || path.url) : path;
    if (!pathStr) return "";
    let fileName = pathStr.split('/').pop().split('?')[0];
    try { return decodeURIComponent(fileName); } catch (e) { return fileName; }
};

// ⭐ 새로 추가: ID를 받아서 전체 데이터(data)의 characters 보관함을 뒤져 진짜 주소를 찾아주는 함수
const resolveImageUrl = (imageId, data) => {
    if (!imageId) return null;
    
    // 이미지가 URL 형태면 그대로 반환 (구버전 호환용)
    if (imageId.startsWith('http') || imageId.startsWith('/images/')) return imageId;

    // 캐릭터 보관함에서 ID 매칭
    for (const char of (data.characters || [])) {
        const allImages = [...(char.portraitImages || []), ...(char.standingImages || [])];
        const found = allImages.find(img => img.id === imageId);
        if (found) {
            return found.url || found.preview || found;
        }
    }
    return imageId; // 못 찾으면 원본 반환
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
    script += `default show_calendar = True\n\n`;

    const protagonist = (data.characters || []).find(c => c.isProtagonist) || {};
    const pName = protagonist.name !== undefined ? protagonist.name : '주인공';
    const pStyle = protagonist.fontStyle || {};

    script += buildCharacterDef("p", pName, pStyle, true);
    
    const safeNarrationStyle = data.narrationFontStyle || pStyle;
    script += buildCharacterDef("narration", null, safeNarrationStyle, false);

    if (data.characters) {
        data.characters.filter(c => !c.isProtagonist).forEach(char => {
            if (char.name !== undefined) {
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

                        // ⭐ 수정: 스탠딩 이미지 ID를 실제 URL로 변환한 후 파일명을 뽑음
                        const resolvedHeroine = resolveImageUrl(sc.heroineImage, data);
                        const hName = resolvedHeroine ? getFileName(resolvedHeroine) : "";
                        
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

                        // ⭐ 수정: 초상화 이미지 ID를 실제 URL로 변환한 후 파일명을 뽑음
                        const resolvedProtagonist = resolveImageUrl(sc.protagonistImage, data);
                        const pName = resolvedProtagonist ? getFileName(resolvedProtagonist) : "";
                        
                        if (pName !== s.p) {
                            out += `    $ current_p_image = "${pName}"\n`;
                            s.p = pName;
                        }

                        let speakerVar = ""; 
                        if (sc.speaker === 'PROTAGONIST') {
                            speakerVar = "p"; 
                        } else if (sc.speaker === '나레이션' || !sc.speaker) {
                            speakerVar = "narration"; 
                        } else {
                            const char = data.characters.find(c => c.name === sc.speaker || c.id.toString() === sc.speaker.toString());
                            speakerVar = char ? `char_${char.id}` : `"${sc.speaker}"`;
                        }

                        const text = sc.text ? sc.text.replace(/"/g, '\\"') : "";
                        out += `    ${speakerVar} "${text}"\n`; 
                    } // dialog 블록 끝
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