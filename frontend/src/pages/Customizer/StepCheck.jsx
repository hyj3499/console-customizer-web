import React, { useMemo } from 'react';
import useCustomizerStore from '../../store/useCustomizerStore';
import './StepCheck.css';

// 에디터와 동일한 선택지 컬러 팔레트 적용
const OPTION_COLORS = ['#ffafee', '#84ccff', '#1971c2', '#e64980', '#7950f2', '#12b886', '#fcc419', '#20c997', '#ff8787', '#5c940d'];

export default function StepCheck({ projectId }) {
    // ⭐ protagonist 대신 characters 전체를 가져옵니다.
    const { events, characters } = useCustomizerStore();

    // ⭐ 통합된 주인공 찾기 로직 반영
    const getSpeakerName = (speaker) => {
        if (speaker === 'PROTAGONIST') {
            const protagonist = characters.find(c => c.isProtagonist) || {};
            return protagonist.name || '주인공';
        }
        return speaker || '나레이션';
    };

    // ⭐ 다중 선택지에 맞춘 시나리오 무결성 검사 로직
    const warnings = useMemo(() => {
        const issueList = [];
        let fullyEndedEventIndex = -1;

        events.forEach((event, index) => {
            const scenarios = event.scenarios;
            const choiceNode = scenarios.find(s => s.type === 'choice');
            const hasChoiceNode = !!choiceNode;

            let isFullyEnded = false;

            if (hasChoiceNode) {
                const totalOptions = choiceNode.options?.length || 2;
                let allEnded = true;

                // 선택지 개수만큼 반복하며 텅 빈 루트와 엔딩 여부 검사
                for (let i = 1; i <= totalOptions; i++) {
                    const branchName = `option${i}`;
                    const branchContents = scenarios.filter(s => s.branch === branchName && s.type !== 'choice');
                    const hasEnding = scenarios.some(s => s.branch === branchName && s.type === 'ending');

                    if (branchContents.length === 0) {
                        issueList.push(`[${event.title}] 선택지 ${i}번 루트에 아무런 대사가 없습니다.`);
                    }
                    
                    if (!hasEnding) {
                        allEnded = false;
                        if (index === events.length - 1 && fullyEndedEventIndex === -1) {
                            issueList.push(`마지막 이벤트인 [${event.title}]의 선택지 ${i}번 루트에 🎬엔딩이 없습니다.`);
                        }
                    }
                }
                isFullyEnded = allEnded;

            } else {
                // 일반 루트 검사
                isFullyEnded = scenarios.some(s => s.branch === 'main' && s.type === 'ending');
                
                if (index === events.length - 1 && fullyEndedEventIndex === -1 && !isFullyEnded) {
                    issueList.push(`마지막 이벤트인 [${event.title}]에 🎬엔딩이 없습니다. 플레이 중 게임이 멈추거나 튕길 수 있습니다.`);
                }
            }

            if (isFullyEnded && fullyEndedEventIndex === -1) {
                fullyEndedEventIndex = index;
            }
        });

        // 도달 불가능한 유령 이벤트 검사
        if (fullyEndedEventIndex !== -1 && fullyEndedEventIndex < events.length - 1) {
            issueList.push(`[${events[fullyEndedEventIndex].title}]에서 이미 모든 스토리가 엔딩을 맞이했습니다. 그 이후에 있는 이벤트들은 게임에서 실행되지 않습니다.`);
        }

        return issueList;
    }, [events]);

    return (
        <div className="step-check-container">
            <h2 className="section-title">📜 전체 시나리오 확인</h2>
            <p className="section-desc">작성한 모든 이벤트와 분기 대사를 대본 형태로 한눈에 확인합니다.</p>

            <div className="scenario-overview">
                {events.map((event) => {
                    const choiceNode = event.scenarios.find(s => s.type === 'choice');

                    return (
                        <div key={event.id} className="event-check-card">
                            <h3 className="event-check-title">📌 {event.title}</h3>
                            
                            {/* 1. 메인 루트 출력 */}
                            <div className="route-block main-route">
                                {event.scenarios.map((sc, idx) => {
                                    if (sc.branch !== 'main') return null;

                                    if (sc.type === 'choice') {
                                        return (
                                            <div key={idx} className="check-choice-node">
                                                <strong>🔀 선택지 분기 발생</strong>
                                                {/* ⭐ 다중 선택지 출력 */}
                                                <div className="choice-options">
                                                    {(sc.options || ['', '']).map((opt, i) => (
                                                        <span key={i} style={{ color: OPTION_COLORS[i % 10] }}>
                                                            {i + 1}번: {opt || '(내용 없음)'}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (sc.type === 'ending') return <div key={idx} className="check-ending">🎬 엔딩: {sc.text}</div>;
                                    if (sc.type === 'cg_image') return <div key={idx} className="check-cg">🖼️ 컷 {idx + 1}: [CG 일러스트 연출]</div>;

                                    return (
                                        <div key={idx} className="check-dialog">
                                            <span className="check-cut-num">컷 {idx + 1}</span>
                                            <span className="check-speaker">({getSpeakerName(sc.speaker)})</span>
                                            <span className="check-text">{sc.text}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* 2. 동적 다중 선택지 루트 출력 */}
                            {choiceNode && (
                                <div className="branches-container">
                                    {(choiceNode.options || ['', '']).map((optText, optIdx) => {
                                        const branchName = `option${optIdx + 1}`;
                                        const branchColor = OPTION_COLORS[optIdx % 10];
                                        
                                        return (
                                            <div key={optIdx} className="route-block" style={{ borderTop: `4px solid ${branchColor}` }}>
                                                <div className="route-header" style={{ color: branchColor }}>
                                                    {optIdx + 1}️⃣ 선택지 {optIdx + 1} [{optText}] 선택 시
                                                </div>
                                                {event.scenarios.map((sc, idx) => {
                                                    if (sc.branch !== branchName) return null;
                                                    
                                                    if (sc.type === 'ending') return <div key={idx} className="check-ending">🎬 엔딩: {sc.text}</div>;
                                                    if (sc.type === 'cg_image') return <div key={idx} className="check-cg">🖼️ 컷 {idx + 1}: [CG 일러스트 연출]</div>;
                                                    
                                                    return (
                                                        <div key={idx} className="check-dialog">
                                                            <span className="check-cut-num">컷 {idx + 1}</span>
                                                            <span className="check-speaker">({getSpeakerName(sc.speaker)})</span>
                                                            <span className="check-text">{sc.text}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ⭐ 시나리오 에러 경고 배너 */}
            {warnings.length > 0 && (
                <div className="scenario-warning-banner" style={{
                    backgroundColor: '#ffe3e3', borderLeft: '5px solid #fa5252',
                    padding: '15px 20px', borderRadius: '8px', marginTop: '25px', color: '#c92a2a', boxShadow: '0 4px 12px rgba(250, 82, 82, 0.15)'
                }}>
                    <h4 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>⚠️</span> 시나리오 흐름에 오류가 있습니다!
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', lineHeight: '1.6' }}>
                        {warnings.map((msg, idx) => (
                            <li key={idx}><strong>{msg}</strong></li>
                        ))}
                    </ul>
                </div>
            )}

            {/* ⭐ 최종 제출 안내 배너 */}
            <div className="submission-guide-banner" style={{
                backgroundColor: 'rgba(25, 113, 194, 0.1)', border: '2px solid #1971c2',
                padding: '25px', borderRadius: '12px', marginTop: '30px', color: '#e0e0e0',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)', backdropFilter: 'blur(5px)'
            }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#74c0fc', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '22px' }}>
                    <span>💌</span> 커미션 신청 및 최종 제출 안내
                </h3>
                
                <div style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '20px' }}>
                    <span style={{ display: 'inline-block', backgroundColor: '#1971c2', color: 'white', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold', marginRight: '10px' }}>
                        현재 프로젝트 ID
                    </span>
                    <span style={{ color: '#a5d8ff', fontWeight: 'bold', borderBottom: '1px solid #a5d8ff', paddingBottom: '2px', fontSize: '18px' }}>
                        {projectId ? projectId : '(로그인/생성된 ID가 없습니다)'}
                    </span>
                    <br /><br />
                    모든 시나리오 작성을 마치셨다면 하단의 <strong>[💾 현재 상태 저장]</strong> 버튼을 꼭 눌러주세요!<br />
                    그 후, <strong><a href="https://crepe.cm" target="_blank" rel="noreferrer" style={{ color: '#ffb3c6', textDecoration: 'underline' }}>크레페(https://crepe.cm/ko/@Choiaelife)</a></strong>를 통해 해당 프로젝트 ID를 제게 전달해 주시면 작업이 시작됩니다.
                </div>

                <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', padding: '15px 20px', borderRadius: '8px', borderLeft: '4px solid #ffb3c6' }}>
                    <strong style={{ color: '#ffb3c6', fontSize: '15px' }}>🛠️ 홈페이지에서 구현할 수 없는 디테일 연출도 추가로 자유롭게 요청 가능합니다!</strong>
                    <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px', fontSize: '14px', color: '#ced4da', lineHeight: '1.7' }}>
                        <li><strong>예시 1:</strong> "이벤트 3의 4번째 컷부터 000 BGM이 재생되게 해주세요."</li>
                        <li><strong>예시 2:</strong> "이벤트 5의 3번째 컷부터 이 캐릭터의 이름표가 '???'로 바뀌게 해주세요."</li>
                        <li><strong>예시 3:</strong> "선택지 1번을 눌렀을 때 화면이 흔들리며 붉어지는 연출을 넣어주세요."</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}