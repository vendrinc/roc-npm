# Start with the debian base image
FROM debian:buster

# Install necessary dependencies
RUN apt-get update && apt-get -y dist-upgrade
RUN apt-get install -y wget git curl
RUN apt-get install -y libxcb-shape0-dev libxcb-xfixes0-dev # for editor clipboard
RUN apt-get install -y libasound2-dev # for editor sounds
RUN apt-get install -y libunwind-dev pkg-config libx11-dev zlib1g-dev
RUN apt-get install -y unzip # for www/build.sh

# install Rust
RUN \
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs > rustup.sh

RUN sh rustup.sh -y

ENV PATH="/root/.cargo/bin:${PATH}"

# install zig, llvm

# editor
RUN apt-get install -y libxkbcommon-dev
# zig builtins wasm tests
RUN apt-get install -y build-essential
#RUN cargo install wasmer-cli --features "singlepass"
#RUN cargo install bindgen
# llvm
RUN apt-get install -y lsb-release software-properties-common gnupg
RUN wget https://apt.llvm.org/llvm.sh
RUN chmod +x llvm.sh
RUN ./llvm.sh 13
RUN ln -s /usr/bin/clang-13 /usr/bin/clang
# use lld as linker
RUN ln -s /usr/bin/lld-13 /usr/bin/ld.lld
ENV RUSTFLAGS="-C link-arg=-fuse-ld=lld -C target-cpu=native"
# wasm repl & tests
RUN rustup target add wasm32-unknown-unknown wasm32-wasi
RUN apt-get install -y libssl-dev
#RUN OPENSSL_NO_VENDOR=1 cargo install wasm-pack
# sccache
#RUN cargo install sccache
#RUN sccache -V
#ENV RUSTC_WRAPPER=/usr/local/cargo/bin/sccache
#ENV SCCACHE_DIR=/earthbuild/sccache_dir
ENV CARGO_INCREMENTAL=0

# COPY --dir crates examples Cargo.toml Cargo.lock version.txt www ./

RUN rustup toolchain install 1.66.1
ENV LLVM_SYS_130_PREFIX=/usr/lib/llvm-13

# zig
RUN mkdir /zig && wget -c https://ziglang.org/download/0.9.1/zig-linux-x86_64-0.9.1.tar.xz --no-check-certificate -O - | tar -xJ -C /zig
RUN ln -s /zig/zig-linux-x86_64-0.9.1/zig /usr/bin/zig
