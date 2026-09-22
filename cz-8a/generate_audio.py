import asyncio
import edge_tts

# 定义每个阶段的文本内容
texts = {
    "stage_0": "长征八号甲遥九运载火箭，千帆极轨十五组卫星发射任务，即将执行。各系统状态良好，等待点火指令。",
    "stage_1": "点火！起飞！芯一级与助推器四台YF-100液氧煤油发动机同时工作，起飞推力约四百八十吨。火箭缓缓离开发射塔架，飞向太空。",
    "stage_2": "飞行一百七十四秒，助推器分离。两台助推器完成使命，与芯一级分离脱落。",
    "stage_3": "飞行一百八十四秒，一二级分离。芯二级YF-75DA氢氧发动机点火，继续推送卫星加速。",
    "stage_4": "飞行二百一十五秒，抛整流罩。五点二米直径整流罩对半分离，卫星堆叠组暴露于太空环境。",
    "stage_5": "二级一次关机，进入无动力滑行段。火箭在惯性作用下继续飞行，准备下一次点火。",
    "stage_6": "飞行八百八十五秒，二级二次点火。改进型YF-75DB发动机工作，将卫星推送至一千一百公里极地轨道。",
    "stage_7": "星箭分离！二十颗千帆平板卫星有序抛撒，太阳能帆板展开。千帆极轨十五组卫星全部成功入轨，千帆星座在轨卫星总数达到二百三十八颗。发射任务圆满成功！"
}

# 选择男生浑厚的声音
VOICE = "zh-CN-YunxiNeural"  # 这是一个浑厚的男生声音

async def generate_audio():
    for stage, text in texts.items():
        output_file = f"E:\\study\\火山方舟\\cases\\case1\\audio\\{stage}.mp3"
        communicate = edge_tts.Communicate(text, VOICE)
        await communicate.save(output_file)
        print(f"Generated {output_file}")

if __name__ == "__main__":
    asyncio.run(generate_audio())
    print("All audio files generated successfully!")
