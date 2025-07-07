<template>
  <div class="container">
    <div class="header">
      <div class="logo">
        <img
          style="height: 6vh"
          alt="logo"
          src="../assets/images/white_bg_logo.png"
        />
        <span href="#" class="name">妙笔 · 富文本知识库</span>
      </div>
      <ul class="links">
        <!-- <li style="color: #6c63ff; cursor: pointer">首页</li>
        <li>
          <a
            href="https://aistudio.baidu.com/competition/detail/1182/0/introduction"
            target="_blank"
            >飞浆AI Studio</a
          >
        </li>
        <li>
          <a
            href="https://www.cnsoftbei.com/content-3-1018-1.html"
            target="_blank"
            >中国软件杯</a
          >
        </li>
        <li>
          <a
            href="https://github.com/electronic-pig/SmartEditor"
            target="_blank"
            >Github</a
          >
        </li> -->
        <router-link to="/login" class="toLogin">登录/注册</router-link>
      </ul>
    </div>
    <el-divider style="margin: 0"></el-divider>
    <div class="content">
      <div class="info">
        <span class="clip">妙笔</span>
        <h1>一个支持在线协同</h1>
        <h1>的富文本知识库系统</h1>
        <p>在线编辑、AI辅助、文档管理</p>
        <button @click="start()">开始试用</button>
      </div>
      <div class="image">
        <div class="img-bg"></div>
        <img
          style="height: 30vh"
          alt="logo"
          src="../assets/images/round_logo.png"
        />
      </div>
    </div>
    <div class="features">
      <div class="feat">
        <h3>知识库和文档管理</h3>
        <p>
          知识库首页支持查看目录树、最近访问列表及新建文档入口，实现知识库的增删改查以及文档的管理、搜索功能。
        </p>
      </div>
      <div class="feat">
        <h3>富文本能力</h3>
        <p>
          基于TIPTAP、ChatGLM大模型等技术，实现文档富文本编辑能力，支持代码块、浮动工具栏、文档大纲跳转等功能，同时提供AI文档摘要能力。
        </p>
      </div>
      <div class="feat">
        <h3>多人在线协同</h3>
        <p>
          根通过分享链接，支持多人在线协同编辑文档能力，并且实现文档历史版本管理功能以及文档划词评论功能。
        </p>
      </div>
    </div>
    <div class="footer">
      <p style="font-size: 2vh">代码小纵队</p>
    </div>
  </div>
</template>

<script setup>
import router from "../router";

const start = () => {
  router.push("/login");
};
</script>

<style scoped>
.header {
  margin: 0 6vw;
  height: 9vh;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
}

.name {
  margin-left: 1vw;
  font-size: 3vh;
  color: #555;
  font-weight: bold;
}

.links {
  list-style: none;
  display: flex;
  align-items: center;
  font-size: 2.5vh;
}

.links li a {
  text-decoration: none;
  margin-left: 3vw;
  color: #5d5d5d;
  cursor: pointer;
  transition: 0.3s;
}

.toLogin {
  text-decoration: none;
  margin-left: 3vw;
  border-radius: 2vh;
  padding: 1vh 1.5vw;
  color: #fff;
  background-color: #6c63ff;
}

.links li a:hover {
  color: #6c63ff;
}

.content {
  margin: auto 13vw;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60vh;
}

.content .info {
  flex: 1;
}

.content .info h1 {
  color: #444;
  font-size: 6vh;
  margin: 0;
}

.content .info .clip {
  font-size: 8vh;
  margin: 0;
  font-weight: bold;
  background: linear-gradient(135deg, #47caff, #bd34fe);
  background-clip: text;
  color: transparent;
}

.content .info p {
  margin: 0;
  padding-top: 1.5vh;
  font-size: 4vh;
  color: #5d5d5d;
}

.content .info button {
  font-size: 2vh;
  border: 0;
  border-radius: 3vh;
  padding: 2vh 2vw;
  margin-top: 3vh;
  cursor: pointer;
  color: #fff;
  background-color: #6c63ff;
}

.content .image {
  position: relative;
  flex: 1;
  display: flex;
  justify-content: center;
}

.content .image .img-bg {
  position: absolute;
  top: -5vh;
  width: 40vh;
  height: 40vh;
  background-color: var(--el-color-primary-light-3);
  border-radius: 50%;
  filter: blur(14vh);
}

.features {
  display: flex;
  justify-content: space-between;
  margin: 0 12vw;
  height: 20vh;
}

.feat {
  flex: 1;
  background-color: #f6f6f7;
  border-radius: 1vh;
  margin: 0 1vh;
  padding: 2vh;
}

.feat h3 {
  font-size: 3vh;
  color: #666;
  margin: 0;
}

.feat p {
  font-size: 2vh;
  color: #888;
  line-height: 1.5;
}

.footer {
  height: 10vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
}
</style>
