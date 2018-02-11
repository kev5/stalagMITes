import xlrd
import networkx as nx
import matplotlib.pyplot as plt
from enthought.mayavi import mlab

H = nx.cycle_graph(20)
mlab.plot(H)

TYPE = 'Cereal'
SHEET_NAME = '%s_LL' % TYPE

book = xlrd.open_workbook('CAVE_Hackathon_Data.xlsx')
cereal_edge_sheet = book.sheet_by_name(SHEET_NAME)

g = nx.DiGraph()
for row in range(cereal_edge_sheet.nrows):
    [source, target] = cereal_edge_sheet.row_values(row)
    g.add_edge(source, target)

leaves = [n for n in g.nodes() if g.out_degree(n) == 0]
leaves_multiple_in = [n for n in leaves if g.in_degree(n) > 1]
print(len(list(nx.simple_cycles(g))))

nx.draw_shell(g)
plt.show()

# pos = nx.spring_layout(g)
# nx.draw_networkx_nodes(g, pos=pos, node_color='k')
# nx.draw_networkx_edges(g, pos=pos)
# plt.show()

