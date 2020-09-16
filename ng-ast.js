/* global window */
(function (root) {

  function isProvider(type, row) {
    return Array.isArray(row) &&
      row[1] === type;
  }

  function providerName(row) {
    return row[2][0];
  }

  // all found modules by name
  var _modules = {};

  var valueProvider, constantProvider, serviceProvider, factoryProvider;
  var $q;

  function moduleToNode(name) {
    if (!name) {
      return {
        name: 'UNKNOWN',
        dependencies: [],
        values: [],
        constants: [],
        services: [],
        factories: [],
        children: [],
      };
      // throw new Error('Expected angular module name');
    }
    if (_modules[name]) {
      return $q.when(_modules[name]);
    }

    var m = angular.module(name);
    if (!m) {
      throw new Error('Cannot find module ' + name);
    }

    // console.log(m._invokeQueue);

    var node = {
      name: name,
      dependencies: m.requires,
      values: m._invokeQueue
        .filter(valueProvider).map(providerName),
      constants: m._invokeQueue
        .filter(constantProvider).map(providerName),
      services: m._invokeQueue
        .filter(serviceProvider).map(providerName),
      factories: m._invokeQueue
        .filter(factoryProvider).map(providerName),
      children: []
    };
    _modules[name] = node;

    var promises = m.requires.map(function (childName) {
      var deferred = $q.defer();
      setTimeout(function () {
        deferred.resolve(moduleToNode(childName));
      }, 0);
      return deferred.promise;
    });

    return $q.all(promises).then(function (childrenNodes) {
      childrenNodes.forEach(function (n) {
        node.children.push(n);
      });
      return node;
    });
  }


  function ngAst(name) {
    _modules = {};

    valueProvider = angular.bind(null, isProvider, 'value');
    constantProvider = angular.bind(null, isProvider, 'constant');
    serviceProvider = angular.bind(null, isProvider, 'service');
    factoryProvider = angular.bind(null, isProvider, 'factory');

    $q = angular.injector(['ng']).get('$q');

    return moduleToNode(name);
  }

  function edgeCount() {
    ngAst('buganizer').then((x) => {
      const m = {};

      const parseTree = (root) => {
        if (!root) {
          return;
        }

        const name = toShortName(root.name);

        if (m[name]) {
          m[name]['in'] += 1;
        } else {
          m[name] = {out: root.children.length, in: 1};
        }

        for (let child of root.children) {
          parseTree(child);
        }
      };

      parseTree(x);

      const s = [];
      for (const [name, entry] of Object.entries(m)) {
        s.push(`${name}\t${entry.in}\t${entry.out}`);
      }

      console.log(s.join('\n'));
    });
  }

  function toShortName(name) {
    if (name === 'buganizer') {
      return name
    } else if (name.startsWith('buganizer.features')) {
      return name.slice(19);
    } else if (name.startsWith('buganizer')) {
      return name.slice(10);
    } else if (name.startsWith('google3.devtools.buganizer.client')) {
      return name.slice(37);
    } else if (name.startsWith('google3/devtools/buganizer/client')) {
      return name.slice(37).replaceAll('/', '.');
    } else {
      return name;
    }
  }

  function sanitizeName(name) {
    return name.replaceAll('.', '_');
  }

  function toDot() {
    const prelude = 'digraph {\n  graph [stylesheet="https://g3doc.corp.google.com/frameworks/g3doc/includes/graphviz-style.css"]\n node [shape=box, style=rounded]\n';
    const epilogue = '}';
    ngAst('buganizer').then((x) => {
      const lines = [];

      const parseTree = (root) => {
        if (!root || root.children.length === 0) {
          return;
        }

        const name = sanitizeName(toShortName(root.name));
        const childrenNames = root.children.map((c) => sanitizeName(toShortName(c.name)));

        lines.push(`  ${name} -> {${childrenNames.join(', ')}}`);

        for (const child of root.children) {
          parseTree(child);
        }
      };

      parseTree(x);

      console.log(`${prelude}${lines.join('\n')}${epilogue}`);
    });
  }

  root.ngAst = ngAst;
  root.toDot = toDot;
  root.edgeCount = edgeCount;

}(typeof window === 'object' ? window : this));
