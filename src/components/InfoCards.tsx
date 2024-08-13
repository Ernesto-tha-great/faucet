interface Props {
  data: {
    title: string;
    desc: string;
    url: string;
  }[];
}

const InfoCards = ({ data }: Props) => {
  return (
    <div className="flex flex-wrap justify-center gap-6 p-6 bg-[#070E1B]">
      {data.map((item, index) => (
        <div
          key={index}
          className="bg-[#0F172A] rounded-lg p-5 max-w-sm w-full md:w-80 shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-3 text-white">
            {item.title}
          </h2>
          <p className="text-gray-300 mb-4">{item.desc}</p>
          <a
            href={item.url}
            className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn More
          </a>
        </div>
      ))}
    </div>
  );
};

export default InfoCards;
