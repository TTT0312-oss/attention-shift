"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { taskPool, type Lane } from "@/lib/task-pool";

type Phase = "title" | "playing" | "result";
type Task = { id:number; text:string; hint:string; lane:Lane; born:number; ttl:number; urgent:boolean };
type RankingRow = { name:string; score:number; cleared:number; bestCombo:number; mistakes:number };

const GAME_SECONDS = 60;
const lanes:{id:Lane;label:string;mark:string}[]=[
  {id:"counter",label:"カウンター",mark:"C"},
  {id:"kitchen",label:"キッチン",mark:"K"},
  {id:"stock",label:"ストック",mark:"S"},
];

function makeTask(id:number,now:number):Task{
  const base=taskPool[Math.floor(Math.random()*taskPool.length)];
  const urgent=Math.random()<.24;
  return{...base,id,born:now,ttl:urgent?7:12,urgent};
}

export default function Home(){
  const [phase,setPhase]=useState<Phase>("title");
  const [timeLeft,setTimeLeft]=useState(GAME_SECONDS);
  const [score,setScore]=useState(0);
  const [combo,setCombo]=useState(0);
  const [bestCombo,setBestCombo]=useState(0);
  const [tasks,setTasks]=useState<Task[]>([]);
  const [selected,setSelected]=useState<number|null>(null);
  const [message,setMessage]=useState("依頼を選んで担当へ送る");
  const [mistakes,setMistakes]=useState(0);
  const [cleared,setCleared]=useState(0);
  const [soundOn,setSoundOn]=useState(true);
  const [impact,setImpact]=useState<""|"good"|"bad"|"super">("");
  const [playerName,setPlayerName]=useState("");
  const [ranking,setRanking]=useState<RankingRow[]>([]);
  const [rank,setRank]=useState<number|null>(null);
  const [rankingOpen,setRankingOpen]=useState(false);
  const [submitting,setSubmitting]=useState(false);
  const [submitMessage,setSubmitMessage]=useState("");

  const nextId=useRef(1);
  const startedAt=useRef(0);
  const bonusSeconds=useRef(0);
  const audioRef=useRef<AudioContext|null>(null);
  const lastTick=useRef(GAME_SECONDS);
  const selectedRef=useRef<number|null>(null);
  const tasksRef=useRef<Task[]>([]);
  const comboRef=useRef(0);

  const tone=useCallback((frequency:number,duration=.08,kind:OscillatorType="square",volume=.035,delay=0)=>{
    if(!soundOn)return;
    const AudioCtor=window.AudioContext;
    if(!AudioCtor)return;
    const ctx=audioRef.current??new AudioCtor();
    audioRef.current=ctx;
    if(ctx.state==="suspended")void ctx.resume();
    const osc=ctx.createOscillator(),gain=ctx.createGain(),at=ctx.currentTime+delay;
    osc.type=kind;
    osc.frequency.setValueAtTime(frequency,at);
    gain.gain.setValueAtTime(volume,at);
    gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at+duration);
  },[soundOn]);

  const playComboTone=useCallback((chain:number)=>{
    const scale=[523.25,587.33,659.25,783.99,880,1046.5,1174.66,1318.51];
    const step=(chain-1)%scale.length;
    const octaveBoost=Math.floor((chain-1)/scale.length);
    const base=Math.min(scale[step]*Math.pow(2,Math.min(octaveBoost,1)),1760);
    tone(base,.075,"square",.045);
    tone(Math.min(base*1.5,2200),.11,"triangle",.03,.05);
    if(chain>=4)tone(Math.min(base*2,2400),.14,"sine",.022,.11);
  },[tone]);

  const hit=useCallback((type:"good"|"bad"|"super")=>{
    setImpact("");
    window.requestAnimationFrame(()=>setImpact(type));
    window.setTimeout(()=>setImpact(""),520);
    if("vibrate" in navigator)navigator.vibrate(type==="bad"?90:type==="super"?[25,25,45]:25);
  },[]);

  const finish=useCallback(()=>{
    tone(392,.12,"square",.04);
    tone(523,.18,"square",.04,.12);
    tone(784,.35,"sawtooth",.035,.26);
    setPhase("result");
    selectedRef.current=null;
    setSelected(null);
  },[tone]);

  const start=useCallback(()=>{
    const now=Date.now();
    const initialTasks=[makeTask(1,now),makeTask(2,now),makeTask(3,now)];
    tone(220,.08);
    tone(440,.1,"square",.04,.09);
    tone(880,.18,"square",.035,.2);
    startedAt.current=now;
    bonusSeconds.current=0;
    lastTick.current=GAME_SECONDS;
    nextId.current=4;
    selectedRef.current=null;
    comboRef.current=0;
    tasksRef.current=initialTasks;
    setTimeLeft(GAME_SECONDS);
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setMistakes(0);
    setCleared(0);
    setSelected(null);
    setMessage("依頼を選んで担当へ送る");
    setTasks(initialTasks);
    setPhase("playing");
  },[tone]);

  useEffect(()=>{
    if(phase!=="playing")return;
    const clock=window.setInterval(()=>{
      const elapsed=Math.floor((Date.now()-startedAt.current)/1000);
      const left=Math.max(0,GAME_SECONDS+bonusSeconds.current-elapsed);
      setTimeLeft(left);
      if(left!==lastTick.current&&left<=10&&left>0)tone(left<=3?880:520,.055,"square",left<=3?.06:.025);
      lastTick.current=left;
      if(left===0)finish();
    },100);
    return()=>window.clearInterval(clock);
  },[phase,finish,tone]);

  useEffect(()=>{
    if(phase!=="playing")return;
    const spawn=window.setInterval(()=>{
      const now=Date.now();
      let added=false;
      setTasks(current=>{
        if(current.length>=6){tasksRef.current=current;return current;}
        const next=[...current,makeTask(nextId.current++,now)];
        tasksRef.current=next;
        added=true;
        return next;
      });
      if(added){
        tone(310,.045,"square",.018);
        tone(465,.05,"square",.018,.045);
        setMessage(Math.random()<.34?"新しい依頼です":"優先順位を確認");
      }
    },3100);
    return()=>window.clearInterval(spawn);
  },[phase,tone]);

  useEffect(()=>{
    if(phase!=="playing")return;
    const expiry=window.setInterval(()=>{
      const now=Date.now();
      setTasks(current=>{
        const alive=current.filter(task=>(now-task.born)/1000<task.ttl);
        const lost=current.length-alive.length;
        if(lost){
          setScore(v=>Math.max(0,v-80*lost));
          comboRef.current=0;
          setCombo(0);
          setMistakes(v=>v+lost);
          setMessage("時間切れ。コンボが途切れました");
          if(selectedRef.current!==null&&!alive.some(task=>task.id===selectedRef.current)){
            selectedRef.current=null;
            setSelected(null);
          }
        }
        const next=alive.length?alive:[makeTask(nextId.current++,now)];
        tasksRef.current=next;
        return next;
      });
    },250);
    return()=>window.clearInterval(expiry);
  },[phase]);

  const selectTask=useCallback((id:number)=>{
    selectedRef.current=id;
    setSelected(id);
  },[]);

  const route=useCallback((lane:Lane)=>{
    const selectedId=selectedRef.current;
    const task=tasksRef.current.find(item=>item.id===selectedId);
    if(!task){
      tone(140,.05,"sawtooth",.025);
      setMessage("先に依頼を選んでください");
      return;
    }

    if(task.lane===lane){
      const age=(Date.now()-task.born)/1000;
      const speed=Math.max(0,Math.round((task.ttl-age)*8));
      const nextCombo=comboRef.current+1;
      const earnedSecond=nextCombo%2===0;
      comboRef.current=nextCombo;

      if(earnedSecond){
        bonusSeconds.current+=1;
        setTimeLeft(v=>v+1);
      }

      setScore(v=>v+100+speed+Math.min(100,nextCombo*10));
      setCombo(nextCombo);
      setBestCombo(v=>Math.max(v,nextCombo));
      setCleared(v=>v+1);

      const nextTasks=tasksRef.current.filter(item=>item.id!==task.id);
      tasksRef.current=nextTasks;
      setTasks(nextTasks);
      selectedRef.current=null;
      setSelected(null);

      if(earnedSecond)setMessage(`${nextCombo} COMBO  +1 SEC`);
      else if(nextCombo>=2)setMessage(`${nextCombo} COMBO`);
      else setMessage(task.urgent?"URGENT CLEAR":"処理完了");

      playComboTone(nextCombo);
      hit(nextCombo>=2?"super":"good");
    }else{
      setScore(v=>Math.max(0,v-60));
      comboRef.current=0;
      setCombo(0);
      setMistakes(v=>v+1);
      setMessage("担当が違います。コンボが途切れました");
      tone(150,.22,"sawtooth",.055);
      tone(95,.3,"square",.035,.08);
      hit("bad");
    }
  },[hit,playComboTone,tone]);

  const selectedTask=useMemo(()=>tasks.find(task=>task.id===selected),[tasks,selected]);

  const loadRanking=useCallback(async()=>{
    try{
      const response=await fetch("/api/leaderboard",{cache:"no-store"});
      if(!response.ok)throw new Error();
      const data=await response.json() as {leaderboard:RankingRow[]};
      setRanking(data.leaderboard);
    }catch{
      setSubmitMessage("ランキングを読み込めませんでした");
    }
  },[]);

  const openRanking=useCallback(()=>{
    setRankingOpen(true);
    setSubmitMessage("");
    void loadRanking();
  },[loadRanking]);

  const submitScore=useCallback(async()=>{
    const name=playerName.trim();
    if(!name){setSubmitMessage("名前を入力してください");return;}
    setSubmitting(true);
    setSubmitMessage("");
    try{
      const response=await fetch("/api/leaderboard",{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({name,score,cleared,bestCombo,mistakes}),
      });
      if(!response.ok)throw new Error();
      const data=await response.json() as {leaderboard:RankingRow[];rank:number|null};
      setRanking(data.leaderboard);
      setRank(data.rank);
      setSubmitMessage(data.rank?`現在 ${data.rank} 位！`:"スコアを登録しました");
      setRankingOpen(true);
    }catch{
      setSubmitMessage("登録できませんでした。もう一度お試しください");
    }finally{
      setSubmitting(false);
    }
  },[playerName,score,cleared,bestCombo,mistakes]);

  const impactLabel=impact==="bad"?"MISS":impact==="super"?`${Math.max(combo,2)} COMBO`:"GOOD";

  return <main className={`game-shell ${timeLeft<=10&&phase==="playing"?"final-count":""}`}>
    <section className={`phone-stage impact-${impact} combo-${Math.min(combo,10)}`} aria-live="polite">
      <div className={`fx-burst ${impact}`} aria-hidden="true">{Array.from({length:14},(_,i)=><i key={i} style={{"--i":i} as React.CSSProperties}/>)}</div>
      <div className={`impact-word ${impact}`} aria-hidden="true">{impactLabel}</div>

      <header className="brand-row">
        <div><span className="eyebrow">MIDNIGHT SERVICE</span><h1>ATTENTION SHIFT</h1></div>
        <div className="header-tools"><button className="sound-toggle" onClick={()=>setSoundOn(v=>!v)} aria-label={soundOn?"音を消す":"音を出す"}>{soundOn?"SOUND ON":"SOUND OFF"}</button><span className="status-light" aria-label="オンライン" /></div>
      </header>

      {phase==="title"&&<div className="title-panel">
        <div className="clock-art" aria-hidden="true"><span>00</span><i /></div>
        <div><p className="kicker">ONE MINUTE SHIFT</p><h2>依頼を見極め、<br/>正しい担当へ。</h2><p className="lead">期限の短い依頼に気を配りながら、次々届く仕事を仕分けしてください。</p></div>
        <div className="mini-guide"><span>1　依頼を選択</span><span>2　担当を判断</span><span>3　2コンボで+1秒</span></div>
        <button className="start-button" onClick={start}>SHIFT START <b>→</b></button>
      </div>}

      {phase==="playing"&&<div className="play-panel">
        <div className="hud"><div><span>TIME</span><strong className={timeLeft<=10?"danger":""}>{String(timeLeft).padStart(2,"0")}</strong></div><div><span>SCORE</span><strong>{score.toLocaleString()}</strong></div><div><span>COMBO</span><strong>×{combo}</strong></div></div>
        <div className="ticker"><i/>{message}</div>
        <div className="queue-head"><span>INCOMING</span><b>{tasks.length}/6</b></div>
        <div className="task-list">{tasks.map(task=>{
          const remaining=Math.max(0,task.ttl-(Date.now()-task.born)/1000);
          const ratio=Math.max(0,remaining/task.ttl);
          return <button key={task.id} className={`task-card ${selected===task.id?"selected":""} ${task.urgent?"urgent":""}`} onClick={()=>selectTask(task.id)}><div className="task-copy"><span>{task.urgent?"URGENT":`REQ.${String(task.id).padStart(2,"0")}`}</span><strong>{task.text}</strong><small>{task.hint}</small></div><div className="task-time"><b>{Math.ceil(remaining)}</b><span>SEC</span></div><i style={{transform:`scaleX(${ratio})`}}/></button>;
        })}</div>
        <div className="dispatch"><span className="dispatch-label">SEND TO {selectedTask?`— ${selectedTask.text}`:""}</span><div className="lane-grid">{lanes.map(lane=><button key={lane.id} onClick={()=>route(lane.id)}><b>{lane.mark}</b><span>{lane.label}</span></button>)}</div></div>
      </div>}

      {phase==="result"&&<div className="result-panel">
        <p className="kicker">SHIFT COMPLETE</p>
        <div className="result-score"><span>SCORE</span><strong>{score.toLocaleString()}</strong></div>
        <div className="result-grid"><div><span>処理件数</span><b>{cleared}</b></div><div><span>最大コンボ</span><b>{bestCombo}</b></div><div><span>ミス・失効</span><b>{mistakes}</b></div></div>
        <div className="score-entry"><label htmlFor="player-name">PLAYER NAME</label><div><input id="player-name" value={playerName} onChange={event=>setPlayerName(event.target.value.slice(0,12))} maxLength={12} placeholder="名前を入力" autoComplete="nickname"/><button onClick={submitScore} disabled={submitting}>{submitting?"送信中":"登録"}</button></div>{submitMessage&&<p>{submitMessage}</p>}</div>
        <div className="result-actions"><button className="ranking-button" onClick={openRanking}>RANKING</button><button className="start-button" onClick={start}>RETRY <b>↻</b></button></div>
      </div>}

      {rankingOpen&&<div className="ranking-overlay" role="dialog" aria-modal="true" aria-label="ランキング"><div className="ranking-sheet"><div className="ranking-head"><div><span>GLOBAL</span><h2>RANKING</h2></div><button onClick={()=>setRankingOpen(false)} aria-label="ランキングを閉じる">×</button></div>{rank&&<p className="your-rank">YOUR RANK <b>#{rank}</b></p>}<ol>{ranking.length?ranking.map((row,index)=><li key={`${row.name}-${index}`} className={row.name===playerName.trim()?"is-you":""}><b>{String(index+1).padStart(2,"0")}</b><span>{row.name}</span><strong>{Number(row.score).toLocaleString()}</strong></li>):<li className="ranking-empty">まだスコアがありません</li>}</ol><button className="ranking-close" onClick={()=>setRankingOpen(false)}>CLOSE</button></div></div>}
    </section>
  </main>;
}
