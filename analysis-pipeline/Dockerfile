FROM node:9.6.1

# See https://crbug.com/795759
RUN apt-get update && apt-get install -yq libgconf-2-4

# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to make the bundled version of Chromium that Puppeteer
# installs, work.
RUN apt-get update && apt-get install -y wget --no-install-recommends \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-unstable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst ttf-freefont \
      --no-install-recommends 

RUN \
  apt-get update && \
  apt-get install -y software-properties-common && \
  add-apt-repository -y "deb http://ppa.launchpad.net/webupd8team/java/ubuntu xenial main" && \
  apt-get update && \
  echo debconf shared/accepted-oracle-license-v1-1 select true | debconf-set-selections  && \
  echo debconf shared/accepted-oracle-license-v1-1 seen true | debconf-set-selections  && \
  DEBIAN_FRONTEND=noninteractive apt-get install -y --force-yes oracle-java8-installer && \
  apt install oracle-java8-set-default && \
  rm -rf /var/cache/oracle-jdk8-installer && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/* 

ADD . /home

RUN cd /home && npm i

WORKDIR /home
ENTRYPOINT [ "node", "main.js" ] 

