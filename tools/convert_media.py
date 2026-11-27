import pathlib, subprocess, json, hashlib, os
root=pathlib.Path(".")
out=root/"compatible"
out.mkdir(exist_ok=True)
mapping={}
def run(args):
    subprocess.run(args,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
for p in sorted((root/"photos").rglob("*")):
    ext=p.suffix.lower()
    if not p.is_file() or ext not in (".mp4",".mov",".heic"): continue
    key=hashlib.sha256(str(p).encode()).hexdigest()[:20]
    dest=out/(key+(".jpg" if ext==".heic" else ".mp4"))
    try:
        if ext==".heic":
            run(["magick",str(p),"-auto-orient","-resize","1600x1600>","-quality","88",str(dest)])
        else:
            probe=json.loads(subprocess.check_output(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(p)]))
            video=next((x for x in probe["streams"] if x["codec_type"]=="video"),None)
            if not video: raise ValueError("No video stream")
            duration=float(probe["format"]["duration"])
            rate=min(1800,max(80,int(21000000*8/max(duration,1)/1000-80)))
            run(["ffmpeg","-nostdin","-y","-i",str(p),"-map","0:v:0","-map","0:a:0?","-vf","scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2","-c:v","libx264","-preset","fast","-pix_fmt","yuv420p","-b:v",str(rate)+"k","-maxrate",str(rate)+"k","-bufsize",str(rate*2)+"k","-c:a","aac","-b:a","64k","-movflags","+faststart",str(dest)])
            if dest.stat().st_size>24*1024*1024: raise ValueError("Output exceeds limit")
            poster=out/(key+".jpg")
            run(["ffmpeg","-nostdin","-y","-i",str(dest),"-frames:v","1","-vf","scale=400:-2","-q:v","4",str(poster)])
        mapping[str(p)]={"src":str(dest),"poster":str(out/(key+".jpg"))}
    except Exception as e:
        print("FAILED",str(p),str(e)[:300])
        dest.unlink(missing_ok=True)
(root/"compatible-media.json").write_text(json.dumps(mapping,ensure_ascii=False),encoding="utf-8")
print("Converted",len(mapping),"assets")
