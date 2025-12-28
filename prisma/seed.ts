import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log("🌱 Seeding database...");

  // Clear related data first (order matters due to foreign keys)
  console.log("🗑️ Clearing old data...");
  await prisma.booking_concessions.deleteMany({});
  await prisma.booking_items.deleteMany({});
  await prisma.bookings.deleteMany({});
  await prisma.showtimes.deleteMany({});
  await prisma.seats.deleteMany({});
  await prisma.screens.deleteMany({});
  await prisma.branches.deleteMany({});
  console.log("✅ Old data cleared");

  // Seed roles
  const roles = ["admin", "staff", "customer"];
  for (const name of roles) {
    await prisma.roles.upsert({
      where: { name },
      update: {},
      create: {
        name,
        description:
          name === "admin"
            ? "Quản trị hệ thống"
            : name === "staff"
            ? "Nhân viên rạp"
            : "Khách hàng",
      },
    });
  }
  console.log("✅ Roles seeded");

  // Seed admin and staff users
  const adminRole = await prisma.roles.findUnique({ where: { name: "admin" } });
  const staffRole = await prisma.roles.findUnique({ where: { name: "staff" } });

  if (adminRole && staffRole) {
    // Create admin user
    const adminEmail = "admin@lmkcinema.vn";
    const existingAdmin = await prisma.users.findUnique({ where: { email: adminEmail } });
    if (!existingAdmin) {
      const admin = await prisma.users.create({
        data: {
          full_name: "Admin LMK",
          email: adminEmail,
          password_hash: await hashPassword("admin123"),
          phone: "0901234567",
          user_roles: {
            create: { role_id: adminRole.id }
          }
        }
      });
      console.log("✅ Admin user created:", admin.email);
    }

    // Create staff users
    const staffUsers = [
      { full_name: "Nguyễn Văn A", email: "staff1@lmkcinema.vn", phone: "0912345678" },
      { full_name: "Trần Thị B", email: "staff2@lmkcinema.vn", phone: "0923456789" },
      { full_name: "Lê Văn C", email: "staff3@lmkcinema.vn", phone: "0934567890" },
    ];

    for (const staff of staffUsers) {
      const existing = await prisma.users.findUnique({ where: { email: staff.email } });
      if (!existing) {
        await prisma.users.create({
          data: {
            full_name: staff.full_name,
            email: staff.email,
            password_hash: await hashPassword("staff123"),
            phone: staff.phone,
            user_roles: {
              create: { role_id: staffRole.id }
            }
          }
        });
      }
    }
    console.log("✅ Staff users seeded");
  }

  // Seed branches (cinemas) - 2 rạp HCM + 2 rạp Bình Dương
  const branches = [
    // TP.HCM
    { name: "LMK Cinema Man Thiện", address: "84 Man Thiện, Phường Hiệp Phú, TP. Thủ Đức", city: "TP.HCM", hotline: "1900 6017" },
    { name: "LMK Cinema Vincom Thủ Đức", address: "216 Võ Văn Ngân, TP Thủ Đức", city: "TP.HCM", hotline: "1900 6017" },
    // Bình Dương
    { name: "LMK Cinema Bình Dương", address: "123 Đại lộ Bình Dương, Thuận An", city: "Bình Dương", hotline: "1900 6017" },
    { name: "LMK Cinema AEON Bình Dương", address: "AEON Mall, Thuận An", city: "Bình Dương", hotline: "1900 6017" },
  ];

  // Create branches
  for (const branch of branches) {
    await prisma.branches.create({ data: branch });
  }
  console.log("✅ Branches seeded");

  // Seed movies - Phim hot 2024-2025 với poster từ TMDB
  const movies = [
    {
      title: "Địa Đàng",
      slug: "dia-dang",
      synopsis: "Một bộ phim kinh dị tâm lý Việt Nam về câu chuyện rùng rợn trong một ngôi nhà bí ẩn. Khi những bí mật đen tối dần được hé lộ, ranh giới giữa thực và ảo trở nên mờ nhạt.",
      genres: "Kinh dị, Tâm lý",
      duration_minutes: 118,
      rating: "T18",
      language: "Tiếng Việt",
      country: "Việt Nam",
      director: "Trần Hữu Tấn",
      cast: "Anh Tú Atus, Lương Thế Thành, Hoàng Linh Chi, Huỳnh Thanh Trực, Rima Thanh Vy, Lê Hà Phương, Duy Luân",
      poster_url: "https://image.tmdb.org/t/p/w500/hUu9zyZmDd8VZegKi1iK1Vk0RYS.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/zOpe0eHsq0A2NvNyBbtT6sj53qV.jpg",
      trailer_url: "https://www.youtube.com/watch?v=example1",
      status: "now_showing" as const,
      release_date: new Date("2024-12-06"),
      is_featured: true,
    },
    {
      title: "Moana 2",
      slug: "moana-2",
      synopsis: "Moana nhận được cuộc gọi bất ngờ từ tổ tiên và phải đi đến vùng biển xa xôi của Châu Đại Dương để thực hiện một nhiệm vụ nguy hiểm chưa từng có.",
      genres: "Hoạt hình, Phiêu lưu, Gia đình",
      duration_minutes: 100,
      rating: "P",
      language: "Tiếng Anh - Phụ đề Việt",
      country: "Mỹ",
      director: "David Derrick Jr., Jason Hand, Dana Ledoux Miller",
      cast: "Auli'i Cravalho, Dwayne Johnson, Alan Tudyk, Rachel House, Temuera Morrison",
      poster_url: "https://image.tmdb.org/t/p/w500/4YZpsylmjHbqeWzjKpUEF8gcLNW.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/tElnmtQ6yz1PjN1kePNl8yMSb59.jpg",
      trailer_url: "https://www.youtube.com/watch?v=hDZ7y8RP5HE",
      status: "now_showing" as const,
      release_date: new Date("2024-11-27"),
      is_featured: true,
    },
    {
      title: "Gladiator II",
      slug: "gladiator-2",
      synopsis: "Sau khi quê hương bị chinh phục bởi các bạo chúa, Lucius buộc phải bước vào Đấu trường La Mã và nhìn về quá khứ để tìm sức mạnh trả lại vinh quang cho Rome.",
      genres: "Hành động, Sử thi, Chính kịch",
      duration_minutes: 148,
      rating: "T18",
      language: "Tiếng Anh - Phụ đề Việt",
      country: "Mỹ",
      director: "Ridley Scott",
      cast: "Paul Mescal, Pedro Pascal, Denzel Washington, Connie Nielsen, Joseph Quinn",
      poster_url: "https://image.tmdb.org/t/p/w500/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/euYIwmwkmz95mnXvufEmbL6ovhZ.jpg",
      trailer_url: "https://www.youtube.com/watch?v=4rgYUipGJNo",
      status: "now_showing" as const,
      release_date: new Date("2024-11-15"),
      is_featured: true,
    },
    {
      title: "Wicked",
      slug: "wicked",
      synopsis: "Câu chuyện chưa kể về các phù thủy xứ Oz - Elphaba với làn da xanh lục bị hiểu lầm và Glinda xinh đẹp nổi tiếng trước khi Dorothy đến từ Kansas.",
      genres: "Nhạc kịch, Giả tưởng",
      duration_minutes: 160,
      rating: "P",
      language: "Tiếng Anh - Phụ đề Việt",
      poster_url: "https://image.tmdb.org/t/p/w500/c5Tqxeo1UpBvnAc3csUm7j3hlQl.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/uKb22E0nlzr914bA9KWUjH6LWi.jpg",
      trailer_url: "https://www.youtube.com/watch?v=6COmYeLsz4c",
      status: "now_showing" as const,
      release_date: new Date("2024-11-22"),
      is_featured: true,
    },
    {
      title: "Linh Miêu: Quỷ Nhập Tràng",
      slug: "linh-mieu-quy-nhap-trang",
      synopsis: "Một câu chuyện kinh dị đậm chất văn hóa Việt Nam về những oan hồn và lời nguyền bí ẩn từ thời phong kiến. Khi quá khứ trở về đòi nợ.",
      genres: "Kinh dị",
      duration_minutes: 109,
      rating: "T18",
      language: "Tiếng Việt",
      country: "Việt Nam",
      director: "Lưu Thành Luân",
      cast: "Hồng Đào, NSƯT Hồng Đào, Thiên An, Văn Anh, Samuel An",
      poster_url: "https://image.tmdb.org/t/p/w500/4FnXXyxRgPrCKdOhBxVoqn7aPXY.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/xlkclSE4iyTXIVqMnxu4rPMV44t.jpg",
      trailer_url: "https://www.youtube.com/watch?v=example5",
      status: "now_showing" as const,
      release_date: new Date("2024-11-22"),
      is_featured: true,
    },
    {
      title: "Venom: The Last Dance",
      slug: "venom-the-last-dance",
      synopsis: "Eddie và Venom đang chạy trốn. Bị cả hai thế giới truy đuổi, họ buộc phải đưa ra quyết định tàn khốc sẽ hạ màn cho điệu nhảy cuối cùng.",
      genres: "Hành động, Khoa học viễn tưởng",
      duration_minutes: 109,
      rating: "T13",
      language: "Tiếng Anh - Phụ đề Việt",
      poster_url: "https://image.tmdb.org/t/p/w500/aosm8NMQ3UyoBVpSxyimorCQykC.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/3V4kLQg0kSqPLctI5ziYWabAZYF.jpg",
      trailer_url: "https://www.youtube.com/watch?v=example6",
      status: "now_showing" as const,
      release_date: new Date("2024-10-25"),
      is_featured: false,
    },
    {
      title: "Kraven the Hunter",
      slug: "kraven-the-hunter",
      synopsis: "Câu chuyện về Kraven - thợ săn vĩ đại nhất thế giới, một trong những nhân vật phản diện nguy hiểm nhất của Spider-Man.",
      genres: "Hành động, Siêu anh hùng",
      duration_minutes: 127,
      rating: "T16",
      language: "Tiếng Anh - Phụ đề Việt",
      poster_url: "https://image.tmdb.org/t/p/w500/i47IUSsN126K11JUzqQIOi1Mg1M.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/v9Du2HC3hlknAvGlWhquRbeifwW.jpg",
      trailer_url: "https://www.youtube.com/watch?v=example7",
      status: "coming_soon" as const,
      release_date: new Date("2024-12-13"),
      is_featured: true,
    },
    {
      title: "Mufasa: The Lion King",
      slug: "mufasa-the-lion-king",
      synopsis: "Rafiki kể cho Kiara về huyền thoại của Mufasa - hành trình từ một chú sư tử mồ côi trở thành Vua sư tử vĩ đại nhất.",
      genres: "Hoạt hình, Phiêu lưu, Gia đình",
      duration_minutes: 118,
      rating: "P",
      language: "Tiếng Anh - Phụ đề Việt",
      poster_url: "https://image.tmdb.org/t/p/w500/lurEK87kukWNaHd0zYnsi3yzJrs.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/wNAhuOZ3Zf84jCIUFWDFwGwAmE.jpg",
      trailer_url: "https://www.youtube.com/watch?v=o17MF9vnabg",
      status: "coming_soon" as const,
      release_date: new Date("2024-12-20"),
      is_featured: true,
    },
    {
      title: "Sonic the Hedgehog 3",
      slug: "sonic-3",
      synopsis: "Sonic, Knuckles và Tails phải đối mặt với kẻ thù mới mạnh mẽ hơn bao giờ hết - Shadow the Hedgehog, nhím đen bí ẩn với sức mạnh khủng khiếp.",
      genres: "Hành động, Phiêu lưu, Gia đình",
      duration_minutes: 110,
      rating: "P",
      language: "Tiếng Anh - Phụ đề Việt",
      poster_url: "https://image.tmdb.org/t/p/w500/d8Ryb8AunYAuycVKDp5HpdWPKgC.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/zOpe0eHsq0A2NvNyBbtT6sj53qV.jpg",
      trailer_url: "https://www.youtube.com/watch?v=qSu6i2iFMO0",
      status: "coming_soon" as const,
      release_date: new Date("2024-12-25"),
      is_featured: true,
    },
    {
      title: "Captain America: Brave New World",
      slug: "captain-america-brave-new-world",
      synopsis: "Sam Wilson với tư cách Captain America mới phải đối mặt với âm mưu toàn cầu và một kẻ thù đáng gờm - Red Hulk.",
      genres: "Hành động, Siêu anh hùng",
      duration_minutes: 140,
      rating: "T13",
      language: "Tiếng Anh - Phụ đề Việt",
      poster_url: "https://image.tmdb.org/t/p/w500/pzIddUEMWhWzfvLI3TwxUG2wGoi.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/gsVC3bNWQ1YaKhqFXs3MJ1sJYvS.jpg",
      trailer_url: "https://www.youtube.com/watch?v=example10",
      status: "coming_soon" as const,
      release_date: new Date("2025-02-14"),
      is_featured: true,
    },
    {
      title: "Kraven the Hunter",
      slug: "kraven-the-hunter",
      synopsis: "Nhà thợ săn Nga Sergei Kravinoff quyết tâm săn lùng Spider-Man sau khi được trao sức mạnh siêu nhiên từ một loại thuốc thử nghiệm.",
      genres: "Hành động, Siêu anh hùng",
      duration_minutes: 130,
      rating: "T16",
      language: "Tiếng Anh - Phụ đề Việt",
      poster_url: "https://image.tmdb.org/t/p/w500/1J3c2OPGx3nnhZ3qZ5vXq1E3q5K.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/8YFL5QQVPy3AgrEQxNYVSgi6beu.jpg",
      trailer_url: "https://www.youtube.com/watch?v=example11",
      status: "now_showing" as const,
      release_date: new Date("2024-12-06"),
      is_featured: true,
    },
    {
      title: "Deadpool & Wolverine",
      slug: "deadpool-wolverine",
      synopsis: "Deadpool và Wolverine hợp tác trong cuộc phiêu lưu đầy bạo lực và hài hước qua đa vũ trụ để cứu thế giới.",
      genres: "Hành động, Hài, Siêu anh hùng",
      duration_minutes: 127,
      rating: "T18",
      language: "Tiếng Anh - Phụ đề Việt",
      poster_url: "https://image.tmdb.org/t/p/w500/7Py8csR6alTEC1g8p0r0J6J9q5x.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/5Eip60UDi6hqSL4xgd6j3kFEq3x.jpg",
      trailer_url: "https://www.youtube.com/watch?v=example12",
      status: "now_showing" as const,
      release_date: new Date("2024-11-20"),
      is_featured: true,
    },
    {
      title: "Inside Out 2",
      slug: "inside-out-2",
      synopsis: "Riley giờ đã 13 tuổi và các cảm xúc mới xuất hiện - Lo lắng, Xấu hổ, Ghen tị và Chán nản - khiến cuộc sống trở nên phức tạp hơn.",
      genres: "Hoạt hình, Gia đình, Hài",
      duration_minutes: 100,
      rating: "P",
      language: "Tiếng Anh - Phụ đề Việt",
      poster_url: "https://image.tmdb.org/t/p/w500/xeqXXTE1Cd3qNaAEOT6qbhhCs6y.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/4TpQortolal1xrv0Bwq8n7OP4X6.jpg",
      trailer_url: "https://www.youtube.com/watch?v=example13",
      status: "now_showing" as const,
      release_date: new Date("2024-11-15"),
      is_featured: true,
    },
    {
      title: "Dune: Part Two",
      slug: "dune-part-two",
      synopsis: "Paul Atreides tiếp tục hành trình trở thành Muad'Dib và lãnh đạo cuộc nổi dậy chống lại Hoàng đế và Nhà Harkonnen.",
      genres: "Khoa học viễn tưởng, Phiêu lưu",
      duration_minutes: 166,
      rating: "T13",
      language: "Tiếng Anh - Phụ đề Việt",
      poster_url: "https://image.tmdb.org/t/p/w500/czembW0Rk1Ke7lCJGahbOhdNuhD.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCny7N9D5Wr4.jpg",
      trailer_url: "https://www.youtube.com/watch?v=example14",
      status: "now_showing" as const,
      release_date: new Date("2024-11-10"),
      is_featured: true,
    },
    {
      title: "Công Tử Bạc Liêu",
      slug: "cong-tu-bac-lieu",
      synopsis: "Câu chuyện về cuộc đời của Công Tử Bạc Liêu - một nhân vật nổi tiếng trong lịch sử Việt Nam với lối sống xa hoa và những câu chuyện huyền thoại.",
      genres: "Lịch sử, Chính kịch",
      duration_minutes: 120,
      rating: "T13",
      language: "Tiếng Việt",
      country: "Việt Nam",
      director: "Đỗ Minh Tuấn",
      cast: "NSND Trần Nhượng, NSƯT Hồng Đào, Lê Công Hoàng, Thanh Hương",
      poster_url: "https://image.tmdb.org/t/p/w500/8xV47NDrjdZDpkVcCFqkdHa3T0C.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/8xV47NDrjdZDpkVcCFqkdHa3T0C.jpg",
      trailer_url: "https://www.youtube.com/watch?v=example15",
      status: "now_showing" as const,
      release_date: new Date("2024-12-01"),
      is_featured: false,
    },
    {
      title: "Avatar 3: Fire and Ash",
      slug: "avatar-3-fire-and-ash",
      synopsis: "Jake Sully và gia đình Na'vi tiếp tục cuộc chiến bảo vệ Pandora khỏi những kẻ xâm lược mới. Lửa và tro tàn sẽ định hình tương lai của hành tinh xanh.",
      genres: "Khoa học viễn tưởng, Phiêu lưu, Hành động",
      duration_minutes: 180,
      rating: "T13",
      language: "Tiếng Anh - Phụ đề Việt",
      country: "Mỹ",
      director: "James Cameron",
      cast: "Sam Worthington, Zoe Saldana, Sigourney Weaver, Stephen Lang",
      poster_url: "https://image.tmdb.org/t/p/w500/9zJj1Ty6vZg9VvbsUzmpfqjnXzr.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/9zJj1Ty6vZg9VvbsUzmpfqjnXzr.jpg",
      trailer_url: "https://www.youtube.com/watch?v=example16",
      status: "coming_soon" as const,
      release_date: new Date("2025-12-19"),
      is_featured: true,
    },
  ];

  for (const movie of movies) {
    await prisma.movies.upsert({
      where: { slug: movie.slug },
      update: movie,
      create: movie,
    });
  }
  console.log("✅ Movies seeded");

  // Seed concessions (bắp nước)
  const concessions = [
    { name: "COMBO GAU", description: "1 Coke 32oz + 1 Bắp 2 Ngăn 64OZ Phô Mai + Caramel", price: 119000, type: "combo" as const },
    { name: "COMBO CÓ GAU", description: "2 Coke 32oz + 1 Bắp 2 Ngăn 64OZ Phô Mai + Caramel", price: 129000, type: "combo" as const },
    { name: "COMBO NHÀ GAU", description: "4 Coke 22oz + 2 Bắp 2 Ngăn 64OZ Phô Mai + Caramel", price: 259000, type: "combo" as const },
    { name: "SPRITE 32OZ", description: "Nước ngọt Sprite size lớn", price: 37000, type: "drink" as const },
    { name: "FANTA 32OZ", description: "Nước ngọt Fanta size lớn", price: 37000, type: "drink" as const },
    { name: "COKE ZERO 32OZ", description: "Coca Cola Zero size lớn", price: 37000, type: "drink" as const },
    { name: "COKE 32OZ", description: "Coca Cola size lớn", price: 37000, type: "drink" as const },
    { name: "Bắp Rang Bơ (L)", description: "Bắp rang bơ size lớn", price: 55000, type: "popcorn" as const },
    { name: "Bắp Rang Phô Mai (L)", description: "Bắp rang phô mai size lớn", price: 59000, type: "popcorn" as const },
  ];

  // Clear existing concessions and recreate
  await prisma.concessions.deleteMany({});
  for (const item of concessions) {
    await prisma.concessions.create({ data: item });
  }
  console.log("✅ Concessions seeded");

  // Seed screens (phòng chiếu) cho mỗi branch
  const screenTypes = ["standard", "vip", "imax"] as const;
  const createdScreens: { id: number; branch_id: number; name: string }[] = [];

  // Get all branches
  const allBranches = await prisma.branches.findMany();
  
  // Clear existing screens and seats
  await prisma.seats.deleteMany({});
  await prisma.screens.deleteMany({});

  for (const branch of allBranches) {
    for (let i = 1; i <= 3; i++) {
      const screenData = {
        branch_id: branch.id,
        name: `Rạp ${String(i).padStart(2, "0")}`,
        seat_rows: 10,
        seat_cols: 12,
        type: screenTypes[i - 1] || "standard",
      };

      const screen = await prisma.screens.create({ data: screenData });
      createdScreens.push({ id: screen.id, branch_id: branch.id, name: screen.name });
    }
  }
  console.log("✅ Screens seeded");

  // Seed seats cho mỗi screen
  const seatRows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  
  for (const screen of createdScreens) {
    const seatsData = [];
    for (const row of seatRows) {
      for (let col = 1; col <= 12; col++) {
        let seatType: "standard" | "vip" | "couple" = "standard";
        
        // VIP seats in middle rows (D-G, columns 3-10)
        if (["D", "E", "F", "G"].includes(row) && col >= 3 && col <= 10) {
          seatType = "vip";
        }
        // Couple seats in last rows (I, J)
        if (["I", "J"].includes(row) && col % 2 === 1) {
          seatType = "couple";
        }

        seatsData.push({
          screen_id: screen.id,
          seat_code: `${row}${col}`,
          seat_row: row,
          seat_number: col,
          seat_type: seatType,
        });
      }
    }
    await prisma.seats.createMany({ data: seatsData });
  }
  console.log("✅ Seats seeded");

  // Seed showtimes cho các phim đang chiếu
  const nowShowingMovies = await prisma.movies.findMany({
    where: { status: "now_showing" },
  });

  // Xóa showtimes cũ
  await prisma.booking_items.deleteMany({});
  await prisma.booking_concessions.deleteMany({});
  await prisma.bookings.deleteMany({});
  await prisma.showtimes.deleteMany({});

  const today = new Date();
  const showtimesData: any[] = [];

  // Các khung giờ chiếu trong ngày
  const showtimeSlots = [
    { hour: 8, minute: 30 },
    { hour: 10, minute: 0 },
    { hour: 11, minute: 30 },
    { hour: 13, minute: 0 },
    { hour: 14, minute: 30 },
    { hour: 16, minute: 0 },
    { hour: 17, minute: 30 },
    { hour: 19, minute: 0 },
    { hour: 20, minute: 30 },
    { hour: 22, minute: 0 },
  ];

  for (const movie of nowShowingMovies) {
    // Tạo suất chiếu cho 7 ngày tới
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() + dayOffset);

      // Mỗi phim chiếu ở 2-3 phòng mỗi rạp
      for (const branch of allBranches) {
        const branchScreens = createdScreens.filter(s => s.branch_id === branch.id);
        // Chọn 2-3 phòng mỗi rạp
        const numScreens = 2 + Math.floor(Math.random() * 2);
        const selectedScreens = branchScreens
          .sort(() => Math.random() - 0.5)
          .slice(0, numScreens);
        
        for (const screen of selectedScreens) {
          // Chọn 4-6 suất chiếu cho mỗi phòng
          const numShowtimes = 4 + Math.floor(Math.random() * 3);
          const shuffledSlots = [...showtimeSlots].sort(() => Math.random() - 0.5);
          const selectedSlots = shuffledSlots.slice(0, numShowtimes);
          
          for (const slot of selectedSlots) {
            const startTime = new Date(date);
            startTime.setHours(slot.hour, slot.minute, 0, 0);

            const endTime = new Date(startTime);
            endTime.setMinutes(endTime.getMinutes() + (movie.duration_minutes || 120));

            // Giá vé dựa trên loại rạp và giờ chiếu
            let basePrice = 45000;
            if (screen.name === "Rạp 02") {
              basePrice = 65000; // VIP
            }
            if (screen.name === "Rạp 03") {
              basePrice = 85000; // IMAX
            }
            if (slot.hour >= 18) {
              basePrice += 10000; // Giá cao hơn buổi tối
            }
            // Cuối tuần giá cao hơn
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
              basePrice += 15000;
            }

            showtimesData.push({
              movie_id: movie.id,
              screen_id: screen.id,
              start_time: startTime,
              end_time: endTime,
              base_price: basePrice,
              language: movie.language || "Tiếng Việt",
              subtitle: movie.language?.includes("Anh") ? "Tiếng Việt" : null,
              status: "selling" as const,
            });
          }
        }
      }
    }
  }

  // Insert in batches to avoid memory issues
  const batchSize = 500;
  for (let i = 0; i < showtimesData.length; i += batchSize) {
    const batch = showtimesData.slice(i, i + batchSize);
    await prisma.showtimes.createMany({ data: batch });
  }
  console.log(`✅ Showtimes seeded (${showtimesData.length} suất chiếu)`);

  console.log("🎉 Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
